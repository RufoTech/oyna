import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectId } from '../common/object-id.util';
import { Venue, VenueDocument } from './schemas/venue.schema';
import { RedisService } from '../redis/redis.service';

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

  private normalizeLocation(location?: any) {
    if (!location) return location;

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

    return location;
  }

  /** Helper to append branch name to venue name for display purposes */
  private formatVenueWithBranch(venue: any): any {
    if (!venue) return venue;
    const v = venue.toObject ? venue.toObject() : venue;
    if (v.branches && v.branches.length > 0 && v.branches[0]) {
      v.name = `${v.name} - ${v.branches[0]}`;
    }
    return v;
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
  async findAll(adminId: string): Promise<any[]> {
    const venues = await this.venueModel.find({ adminId: toObjectId(adminId) }).lean().exec();
    return venues.map(v => this.formatVenueWithBranch(v));
  }

  // Get single venue filtered by adminId
  async findOne(id: string, adminId: string): Promise<Venue> {
    const venue = await this.venueModel
      .findOne({ _id: id, adminId: toObjectId(adminId) })
      .exec();
    if (!venue) {
      throw new NotFoundException(`Məkan tapılmadı və ya icazəniz yoxdur.`);
    }
    return venue;
  }

  // ═══════════════════════════════════════════════
  // PUBLIC ENDPOINTS (Flutter App) — Redis Cached
  // ═══════════════════════════════════════════════

  async findAllPublic(search?: string): Promise<Venue[]> {
    // Dinamik Axtarış varsa Redis-ə toxunmadan (Bypass) gətir
    if (search) {
      this.logger.debug(`🔍 Search query "${search}" → Direct DB query`);
      const regex = new RegExp(search, 'i');
      const results = await this.venueModel.find({
        status: { $in: ['ACTIVE', 'DRAFT', 'PUBLISHED', 'INACTIVE'] },
        $or: [
          { name: regex },
          { category: regex },
          { 'location.address': regex },
        ],
      }).select('-specs').lean().exec();
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
      status: { $in: ['ACTIVE', 'DRAFT', 'PUBLISHED', 'INACTIVE'] },
    }).select('-specs').lean().exec();
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
    const venueRaw = await this.venueModel.findById(id).lean().exec();
    if (!venueRaw) {
      throw new NotFoundException(`Məkan tapılmadı.`);
    }
    const venue = this.formatVenueWithBranch(venueRaw);

    // 3. Store in Redis
    await this.redisService.set(cacheKey, venue, CACHE_TTL.DETAIL);

    return venue;
  }

  async findManyPublic(ids: string[]): Promise<Venue[]> {
    if (!ids || ids.length === 0) return [];
    const idSet = new Set(ids);
    const allVenues = await this.findAllPublic();
    return allVenues.filter((v: any) => idSet.has(v._id.toString()));
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
    const match: any = {
      status: { $in: ['ACTIVE', 'DRAFT', 'PUBLISHED', 'INACTIVE'] },
    };

    // Add search filter if provided
    if (search) {
      const regex = new RegExp(search, 'i');
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

    const pipeline: any[] = [];

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

    const data = dataRaw.map((v: any) => this.formatVenueWithBranch(v));

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

  async remove(id: string, adminId: string): Promise<any> {
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

  async getSpecs(id: string, adminId: string): Promise<any> {
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

  async updateSpecs(id: string, specsDto: any, adminId: string): Promise<any> {
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

    return updatedVenue.specs;
  }

  // ═══════════════════════════════════════════════
  // LAYOUT METHODS (Floor-plan simulator)
  // ═══════════════════════════════════════════════

  async getLayout(id: string, adminId: string): Promise<any> {
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
  async getPublicLayout(id: string): Promise<any> {
    const venue = await this.venueModel
      .findById(id)
      .select('layout')
      .lean()
      .exec();
    if (!venue) {
      throw new NotFoundException('Məkan tapılmadı.');
    }
    return (venue as any).layout || { items: [] };
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

    const items: any[] = (venue as any).layout?.items || [];
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
  async findRandomAvailableTable(venueId: string, tierId: string, tierTitle?: string): Promise<any | null> {
    const venue = await this.venueModel
      .findById(venueId)
      .select('layout')
      .lean()
      .exec();
    if (!venue) return null;

    const items: any[] = (venue as any).layout?.items || [];
    
    // DEBUG: Log all items' tierId values to find the mismatch
    const allTierIds = items.map(item => ({ name: item.name, tierId: item.tierId, status: item.status, type: item.type }));
    this.logger.debug(`🔍 findRandomAvailableTable called with tierId="${tierId}", tierTitle="${tierTitle}"`);
    this.logger.debug(`🔍 All layout items: ${JSON.stringify(allTierIds)}`);

    const matchesTier = (itemTierId: string) => {
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

    this.logger.debug(`🔍 Available matches: ${availables.length}`);

    if (availables.length === 0) return null;

    // Random seçim
    const randomIndex = Math.floor(Math.random() * availables.length);
    return availables[randomIndex];
  }

  async updateLayout(id: string, layoutDto: any, adminId: string): Promise<any> {
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

    return updatedVenue.layout;
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