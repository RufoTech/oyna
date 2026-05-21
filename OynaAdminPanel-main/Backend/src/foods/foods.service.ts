import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectId } from '../common/object-id.util';
import { Food, FoodDocument } from './schemas/food.schema';
import { RedisService } from '../redis/redis.service';

// ═══════════════════════════════════════════════
// Cache Key Constants & TTL
// ═══════════════════════════════════════════════
const CACHE_KEYS = {
  /** Bütün yeməklər siyahısı (adminId-yə görə) */
  FOODS_BY_ADMIN: (adminId: string) => `foods:admin:${adminId}`,
} as const;

const CACHE_TTL = {
  LIST: 600, // 10 dəqiqə — menyu siyahısı
} as const;

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name);

  constructor(
    @InjectModel(Food.name) private foodModel: Model<FoodDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createFoodDto: Partial<Food>): Promise<Food> {
    const createdFood = new this.foodModel(createFoodDto);
    const saved = await createdFood.save();

    // ✅ Admin yeni yemək əlavə etdi — menyu keşini sil
    await this.invalidateFoodsCache(saved.adminId.toString());

    return saved;
  }

  async findAll(adminId: string): Promise<Food[]> {
    const cacheKey = CACHE_KEYS.FOODS_BY_ADMIN(adminId);

    // 1. Redis-dən yoxla
    const cached = await this.redisService.get<Food[]>(cacheKey);
    if (cached) {
      this.logger.debug(`⚡ [CACHE HIT] ${cacheKey}`);
      return cached;
    }

    // 2. Cache miss — MongoDB-dən çək
    this.logger.debug(`🔍 [CACHE MISS] ${cacheKey} → MongoDB query`);
    const foods = await this.foodModel
      .find({ adminId: toObjectId(adminId) })
      .sort({ createdAt: -1 })
      .exec();

    // 3. Redis-ə yaz
    await this.redisService.set(cacheKey, foods, CACHE_TTL.LIST);

    return foods;
  }

  async findOne(id: string, adminId: string): Promise<Food> {
    const food = await this.foodModel
      .findOne({ _id: id, adminId: toObjectId(adminId) })
      .exec();
    if (!food) {
      throw new NotFoundException('Food tapilmadi.');
    }
    return food;
  }

  async update(
    id: string,
    updateFoodDto: Partial<Food>,
    adminId: string,
  ): Promise<Food> {
    const updatedFood = await this.foodModel
      .findOneAndUpdate(
        { _id: id, adminId: toObjectId(adminId) },
        updateFoodDto,
        { new: true },
      )
      .exec();

    if (!updatedFood) {
      throw new NotFoundException('Food tapilmadi.');
    }

    // ✅ Admin yeməyi redaktə etdi — menyu keşini sil
    await this.invalidateFoodsCache(adminId);

    return updatedFood;
  }

  async remove(id: string, adminId: string): Promise<Food> {
    const deletedFood = await this.foodModel
      .findOneAndDelete({ _id: id, adminId: toObjectId(adminId) })
      .exec();

    if (!deletedFood) {
      throw new NotFoundException('Food tapilmadi.');
    }

    // ✅ Admin yeməyi sildi — menyu keşini sil
    await this.invalidateFoodsCache(adminId);

    return deletedFood;
  }

  // ═══════════════════════════════════════════════
  // CACHE INVALIDATION
  // ═══════════════════════════════════════════════

  /** Həmin adminin menyu keşini sil */
  private async invalidateFoodsCache(adminId: string): Promise<void> {
    const key = CACHE_KEYS.FOODS_BY_ADMIN(adminId);
    await this.redisService.del(key);
    this.logger.debug(`🗑️ [CACHE INVALIDATED] ${key}`);
  }
}
