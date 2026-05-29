import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { toObjectId } from '../common/object-id.util';
import { Venue, VenueDocument, GeoLocation, Specs, Layout, LayoutItem } from './schemas/venue.schema';
import { RedisService } from '../redis/redis.service';
import { UpdateSpecsDto, UpdateLayoutDto } from './dto/venues.dto';

// ═══════════════════════════════════════════════
// Cache Key Constants & TTL
// ═══════════════════════════════════════════════
const CACHE_KEYS = {
  PUBLIC_ALL: 'venues:public:all',
  DETAIL: (id: string) => `venues:detail:${id}`,
} as const;

const CACHE_TTL = {
  LIST: 600,    // 10 dəqiqə — məkanlar siyahısı
  DETAIL: 600,  // 10 dəqiqə — tək məkan detalı
} as const;

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    private readonly redisService: RedisService,
  ) {}

  private normalizeLocation(location?: {
    type?: string;
    coordinates?: number[];
    lng?: number;
    lat?: number;
    city?: string;
    address?: string;
  } | null) {
    if (!location) return undefined;

    if (
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      return {
        type: 'Point',
        coordinates: [
          Number(location.coordinates[0]),
          Number(location.coordinates[1]),
        ],
        city: location.city || '',
        address: location.address || '',
      };
    }

    if (typeof location.lng === 'number' && typeof location.lat === 'number') {
      return {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        city: location.city || '',
        address: location.address || '',
      };
    }

    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
      return {
        type: 'Point',
        coordinates: location.coordinates,
        city: location.city || '',
        address: location.address || '',
      };
    }

    return undefined;
  }

  /** Helper to append branch name to venue name for display purposes */
  private formatVenueWithBranch<T extends Venue>(venue: T): T {
    if (!venue) return venue;
    const v = 'toObject' in venue && typeof (venue as { toObject?: unknown }).toObject === 'function'
      ? (venue as { toObject: () => T }).toObject()
      : { ...venue };
    if (v.branches && v.branches.length > 0 && v.branches[0]) {
      v.name = `${v.name} - ${v.branches[0]}`;
    }
    return v as T;
  }

  private normalizeVenuePayload(payload: Partial<Venue>): Partial<Venue> {
    if (!payload.location) return payload;

    return {
      ...payload,
      location: this.normalizeLocation(payload.location),
    };
  }

  // Step 1 initial creation (usually saved as DRAFT initially)
  async create(createVenueDto: Partial<Venue>): Promise<Venue> {
    const normalizedDto = this.normalizeVenuePayload(createVenueDto);
    const existing = await this.venueModel.countDocuments({
      adminId: normalizedDto.adminId,
    });
    if (existing >= 1) {
      throw new BadRequestException('Hər admin yalnız 1 məkan yarada bilər.');
    }
    const createdVenue = new this.venueModel({
      ...normalizedDto,
      status: 'DRAFT',
    });
    const saved = await createdVenue.save();

    // ✅ Invalidate public venue list cache
    await this.invalidatePublicCache();

    return saved;
  }

  // Get all venues for the list filtered by adminId
  async findAll(adminId: string): Promise<Venue[]> {
    const venues = await this.venueModel.find({ adminId: toObjectId(adminId) }).lean().exec();
    return venues.map(v => this.formatVenueWithBranch(v));
  }

  // Get single venue filtered by adminId
  async findOne(id: string, adminId: string): Promise<Venue> {
    const venue = await this.venueModel
      .findOne({ _id: id, adminId: toObjectId(adminId) })
      .lean()
      .exec();
    if (!venue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }
    return venue as unknown as Venue;
  }

  // ═══════════════════════════════════════════════
  // PUBLIC ENDPOINTS (Flutter App) — Redis Cached
  // ═══════════════════════════════════════════════

  async findAllPublic(search?: string, limit: number = 1000): Promise<Venue[]> {
    // Dinamik Axtarış varsa Redis-ə toxunmadan (Bypass) gətir
    if (search) {
      this.logger.debug(`🔍 Search query "${search}" → Direct DB query`);
      const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      const results = await this.venueModel.find({
        status: { $in: ['ACTIVE', 'PUBLISHED', 'INACTIVE'] },
        $or: [
          { name: regex },
          { category: regex },
          { 'location.address': regex },
        ],
      })
      .select('-specs')
      .limit(limit)
      .lean()
      .exec();
      return results.map(v => this.formatVenueWithBranch(v));
    }

    // Axtarış yoxdursa -> Ana siyahını Redis-dən yoxla
    const cacheKey = CACHE_KEYS.PUBLIC_ALL;
    const cached = await this.redisService.get<Venue[]>(cacheKey);
    if (cached) {
      this.logger.debug(`⚡ [CACHE HIT] ${cacheKey}`);
      return cached;
    }

    // Cache miss — MongoDB-dən ana siyahını çək
    this.logger.debug(`🔍 [CACHE MISS] ${cacheKey} → MongoDB query`);
    const venuesRaw = await this.venueModel.find({
      status: { $in: ['ACTIVE', 'PUBLISHED', 'INACTIVE'] },
    })
    .select('-specs')
    .limit(limit)
    .lean()
    .exec();
    const venues = venuesRaw.map(v => this.formatVenueWithBranch(v));

    // Redis-ə yaz
    await this.redisService.set(cacheKey, venues, CACHE_TTL.LIST);

    return venues;
  }

  async findOnePublic(id: string): Promise<Venue> {
    const cacheKey = CACHE_KEYS.DETAIL(id);

    // 1. Check Redis first
    const cached = await this.redisService.get<Venue>(cacheKey);
    if (cached) {
      this.logger.debug(`⚡ [CACHE HIT] ${cacheKey}`);
      return cached;
    }

    // 2. Cache miss — query MongoDB
    this.logger.debug(`🔍 [CACHE MISS] ${cacheKey} → MongoDB query`);
    const venueRaw = await this.venueModel.findOne({ _id: id, status: { $in: ['ACTIVE', 'PUBLISHED', 'INACTIVE'] } }).lean().exec();
    if (!venueRaw) {
      throw new NotFoundException(`Məkan tapılmadı və ya aktiv deyil.`);
    }
    const venue = this.formatVenueWithBranch(venueRaw);

    // 3. Store in Redis
    await this.redisService.set(cacheKey, venue, CACHE_TTL.DETAIL);

    return venue;
  }

  async findManyPublic(ids: string[]): Promise<Venue[]> {
    if (!ids || ids.length === 0) return [];
    const results = await this.venueModel
      .find({ _id: { $in: ids }, status: { $in: ['ACTIVE', 'PUBLISHED', 'INACTIVE'] } })
      .select('-specs')
      .lean()
      .exec();
    return results.map((v) => this.formatVenueWithBranch(v));
  }

  /**
   * Paginated public venues — used by the Flutter Search screen.
   * Returns { data, total, page, limit, hasMore }
   */
  async findAllPublicPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    filterBy?: string,
    lat?: number,
    lng?: number,
  ): Promise<{
    data: Venue[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    const match: mongoose.QueryFilter<Venue> = {
      status: { $in: ['ACTIVE', 'PUBLISHED', 'INACTIVE'] },
    };

    // Add search filter if provided
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      match.$or = [
        { name: regex },
        { category: regex },
        { 'location.address': regex },
      ];
    }

    // Add filters
    if (filterBy === 'open_now') {
      match.temporarilyClosed = false;
      // Note: Full "Open Now" logic is complex for MongoDB queries 
      // without heavy aggregation. We'll rely on the status and temporarilyClosed for now,
      // and ideally the frontend can filter or we can refine this later.
    }

    const pipeline: mongoose.PipelineStage[] = [];

    // 1. Geo-Near Stage (Must be first if sorting by distance)
    if (sortBy === 'distance' && lat !== undefined && lng !== undefined) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: match,
        },
      });
    } else {
      pipeline.push({ $match: match });
    }

    // 2. Sorting (if not already sorted by distance)
    if (sortBy === 'alphabetical_asc') {
      pipeline.push({ $sort: { name: 1 } });
    } else if (sortBy === 'alphabetical_desc') {
      pipeline.push({ $sort: { name: -1 } });
    } else if (sortBy !== 'distance') {
      // Default sort (e.g. by creation date)
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // 3. Faceted Search for Data and Total Count
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }, { $project: { specs: 0 } }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.venueModel.aggregate(pipeline).exec();

    const dataRaw = result.data || [];
    const total = result.totalCount?.[0]?.count || 0;

    const data = dataRaw.map((v: Venue) => this.formatVenueWithBranch(v));

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total,
    };
  }

  // Update venue (to save Steps 2, 3 or Publish)
  async update(
    id: string,
    updateVenueDto: Partial<Venue>,
    adminId: string,
  ): Promise<Venue> {
    const normalizedDto = this.normalizeVenuePayload(updateVenueDto);
    const updatedVenue = await this.venueModel
      .findOneAndUpdate(
        { _id: id, adminId: toObjectId(adminId) },
        normalizedDto,
        { new: true },
      )
      .exec();
    if (!updatedVenue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }

    // ✅ Invalidate caches for this venue + public lists
    await this.invalidateVenueCache(id);

    return updatedVenue;
  }

  async remove(id: string, adminId: string): Promise<VenueDocument> {
    const result = await this.venueModel
      .findOneAndDelete({ _id: id, adminId: toObjectId(adminId) })
      .exec();
    if (!result) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }

    // ✅ Invalidate caches for this venue + public lists
    await this.invalidateVenueCache(id);

    return result;
  }

  async findAllBranches(adminId: string): Promise<string[]> {
    const branches = await this.venueModel
      .distinct('branches', { adminId: toObjectId(adminId) })
      .exec();
    return branches.filter(Boolean); // Filter out null/empty strings
  }
  // ═══════════════════════════════════════════════
  // BLOCKED USERS
  // ═══════════════════════════════════════════════

  async blockUserForVenue(venueId: string, email: string, action: 'block' | 'unblock', adminId: string): Promise<Venue> {
    const filter = { _id: venueId, adminId: toObjectId(adminId) };

    const update = action === 'block'
      ? { $addToSet: { blockedUsers: email } }
      : { $pull: { blockedUsers: email } };

    const updated = await this.venueModel.findOneAndUpdate(filter, update, { new: true }).exec();

    if (!updated) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }

    // Invalidate detail cache since user block status changed
    await this.redisService.del(CACHE_KEYS.DETAIL(venueId));

    return updated;
  }

  async getBlockedUsers(venueId: string, adminId: string): Promise<string[]> {
    const venue = await this.venueModel.findOne({ _id: venueId, adminId: toObjectId(adminId) }).select('blockedUsers').exec();
    if (!venue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }
    return venue.blockedUsers || [];
  }


  // ═══════════════════════════════════════════════
  // SPECS METHODS (Step 4 — Tiers & Packages)
  // ═══════════════════════════════════════════════

  async getSpecs(id: string, adminId: string): Promise<Specs> {
    const venue = await this.venueModel
      .findOne({ _id: id, adminId: toObjectId(adminId) })
      .select('specs')
      .exec();
    if (!venue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }
    return (
      venue.specs || {
        pageTitle: '',
        pageSubtitle: '',
        tiers: [],
        packages: [],
      }
    );
  }

  async updateSpecs(id: string, specsDto: UpdateSpecsDto, adminId: string): Promise<Specs> {
    const updatedVenue = await this.venueModel
      .findOneAndUpdate(
        { _id: id, adminId: toObjectId(adminId) },
        { $set: { specs: specsDto } },
        { new: true },
      )
      .select('specs')
      .exec();

    if (!updatedVenue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }

    // ✅ Invalidate detail cache for this venue
    await this.redisService.del(CACHE_KEYS.DETAIL(id));

    return updatedVenue.specs as Specs;
  }

  // ═══════════════════════════════════════════════
  // LAYOUT METHODS (Floor-plan simulator)
  // ═══════════════════════════════════════════════

  async getLayout(id: string, adminId: string): Promise<Layout> {
    const venue = await this.venueModel
      .findOne({ _id: id, adminId: toObjectId(adminId) })
      .select('layout')
      .exec();
    if (!venue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }
    return venue.layout || { items: [] };
  }

  /** Get layout for public use (Flutter floor plan) — no admin auth required */
  async getPublicLayout(id: string): Promise<Layout> {
    const cacheKey = CACHE_KEYS.DETAIL(id);
    try {
      const cached = await this.redisService.get<Venue>(cacheKey);
      if (cached && cached.layout) {
        return cached.layout;
      }
    } catch (err) {
      // Ignore Redis error
    }

    const venue = await this.venueModel
      .findById(id)
      .select('layout')
      .lean()
      .exec();
    if (!venue) {
      throw new NotFoundException('Məkan tapılmadı.');
    }
    return venue.layout || { items: [] };
  }

  /** Update a single table's status inside venue layout */
  async syncTableStatus(venueId: string, tableId: string, reservationStatus: string): Promise<void> {
    const statusMap: Record<string, string> = {
      pending: 'reserved',
      accepted: 'reserved',
      awaiting_arrival: 'reserved',
      arrived: 'occupied',
      rejected: 'available',
      canceled: 'available',
      no_show: 'available',
    };

    const tableStatus = statusMap[reservationStatus] || 'available';

    await this.venueModel.updateOne(
      { _id: venueId, 'layout.items.id': tableId },
      { $set: { 'layout.items.$.status': tableStatus, 'layout.updatedAt': new Date() } },
    );

    try {
      await this.redisService.del(CACHE_KEYS.DETAIL(venueId));
    } catch (err) {
      // Ignore Redis error
    }

    this.logger.debug(`🔄 Table ${tableId} status → ${tableStatus} (reservation: ${reservationStatus})`);
  }

  /** Get available (status=available) table counts grouped by tierId */
  async getAvailableTableCounts(venueId: string): Promise<Record<string, number>> {
    const venue = await this.venueModel
      .findById(venueId)
      .select('layout')
      .lean()
      .exec();
    if (!venue) return {};

    const items = venue.layout?.items || [];
    const counts: Record<string, number> = {};

    for (const item of items) {
      if (!item.tierId) continue;
      // Store counts for both raw tierId AND normalized title
      const normalizedTitle = item.tierId.replace(/^tier_\d+_/, '').replace(/_/g, ' ');
      
      if (!counts[item.tierId]) counts[item.tierId] = 0;
      if (!counts[normalizedTitle]) counts[normalizedTitle] = 0;
      
      if (item.status === 'available') {
        counts[item.tierId]++;
        counts[normalizedTitle]++;
      }
    }

    return counts;
  }

  /** Find a random available table for a given tierId or tierTitle */
  async findRandomAvailableTable(venueId: string, tierId: string, tierTitle?: string): Promise<LayoutItem | null> {
    const venue = await this.venueModel
      .findById(venueId)
      .select('layout')
      .lean()
      .exec();
    if (!venue) return null;

    const items = venue.layout?.items || [];
    
    this.logger.debug(`findRandomAvailableTable called with tierId="${tierId}", tierTitle="${tierTitle}"`);

    const matchesTier = (itemTierId?: string) => {
      if (!itemTierId) return false;
      if (itemTierId === tierId) return true;
      if (tierTitle && itemTierId === tierTitle) return true;
      // Handle format: "tier_0_Sadə_Computer" vs "Sadə Computer"
      const normalized = itemTierId.replace(/^tier_\d+_/, '').replace(/_/g, ' ');
      if (normalized === tierId || (tierTitle && normalized === tierTitle)) return true;
      return false;
    };

    const availables = items.filter(
      (item) => matchesTier(item.tierId) && item.status === 'available',
    );

    if (availables.length === 0) return null;

    // Random seçim
    const randomIndex = Math.floor(Math.random() * availables.length);
    return availables[randomIndex];
  }

  async updateLayout(id: string, layoutDto: UpdateLayoutDto, adminId: string): Promise<Layout> {
    const updatedVenue = await this.venueModel
      .findOneAndUpdate(
        { _id: id, adminId: toObjectId(adminId) },
        {
          $set: {
            layout: {
              items: Array.isArray(layoutDto?.items) ? layoutDto.items : [],
              updatedAt: new Date(),
            },
          },
        },
        { new: true },
      )
      .select('layout')
      .exec();

    if (!updatedVenue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }

    // ✅ Invalidate detail cache (layout is part of venue document)
    await this.redisService.del(CACHE_KEYS.DETAIL(id));

    return updatedVenue.layout as Layout;
  }

  // ═══════════════════════════════════════════════
  // CACHE INVALIDATION HELPERS
  // ═══════════════════════════════════════════════

  /** Invalidate all public venue list caches (all + search results) */
  private async invalidatePublicCache(): Promise<void> {
    await this.redisService.del(CACHE_KEYS.PUBLIC_ALL);
  }

  /** Invalidate a specific venue's detail cache + all public lists */
  private async invalidateVenueCache(venueId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(CACHE_KEYS.DETAIL(venueId)),
      this.redisService.del(CACHE_KEYS.PUBLIC_ALL),
    ]);
  }
}