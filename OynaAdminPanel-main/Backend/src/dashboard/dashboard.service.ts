import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Venue, VenueDocument } from '../venues/schemas/venue.schema';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getDashboardStats(adminIdStr: string) {
    const cacheKey = `dashboard:stats:${adminIdStr}`;
    try {
      const cached = await this.redisService.get<unknown>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      // Ignore Redis read error
    }

    const adminId = new Types.ObjectId(adminIdStr);

    // 1. Get venue count and IDs efficiently
    const venues = await this.venueModel
      .find({ adminId })
      .select('_id')
      .lean()
      .exec();
    const totalVenues = venues.length;
    const venueIdStrings = venues.map((v) => v._id.toString());

    // 2. Prepare date range for activity data (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 3. Run all aggregations in parallel — no JS-side counting
    const [statusStats, recentBookings, activityRaw] = await Promise.all([
      // Status counts via MongoDB $group
      this.reservationModel.aggregate([
        { $match: { venueId: { $in: venueIdStrings } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).exec(),

      // Last 5 reservations — fetched with limit, not slice
      this.reservationModel
        .find({ venueId: { $in: venueIdStrings } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('userName venueName date time status tierPrice')
        .lean()
        .exec(),

      // Activity data — last 7 days grouped by date in MongoDB
      this.reservationModel.aggregate([
        {
          $match: {
            venueId: { $in: venueIdStrings },
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: '$createdAt' },
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]).exec(),
    ]);

    // 4. Parse status counts from aggregation result
    const statusMap: Record<string, number> = {};
    for (const item of statusStats) {
      statusMap[item._id] = item.count;
    }
    const pendingCount = statusMap['pending'] || 0;
    const acceptedCount = statusMap['accepted'] || 0;
    const rejectedCount =
      (statusMap['rejected'] || 0) +
      (statusMap['canceled'] || 0) +
      (statusMap['no_show'] || 0);
    const totalReservations = Object.values(statusMap).reduce((a, b) => a + b, 0);

    // 5. Build activity data array with all 7 days (fill gaps with 0)
    const activityCountMap = new Map<string, number>();
    for (const item of activityRaw) {
      const key = `${item._id.day}-${item._id.month}`;
      activityCountMap.set(key, item.count);
    }

    const monthNames = ['', 'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
    const activityData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}-${d.getMonth() + 1}`;
      const label = `${d.getDate()} ${monthNames[d.getMonth() + 1]}`;
      activityData.push({
        date: label,
        count: activityCountMap.get(key) || 0,
      });
    }

    // 6. Format recent bookings
    const formattedBookings = (recentBookings as unknown as (Reservation & { _id: Types.ObjectId })[]).map((r) => ({
      _id: r._id,
      userName: r.userName,
      venueName: r.venueName,
      date: r.date,
      time: r.time,
      status: r.status,
      price: r.tierPrice,
    }));

    const stats = {
      totalVenues,
      pendingReservations: pendingCount,
      acceptedReservations: acceptedCount,
      rejectedReservations: rejectedCount,
      statusStats: {
        pending: pendingCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        total: totalReservations || 1,
      },
      activityData,
      recentBookings: formattedBookings,
    };

    try {
      await this.redisService.set(cacheKey, stats, 30);
    } catch (err) {
      // Ignore Redis write error
    }

    return stats;
  }
}
