import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Venue, VenueDocument } from '../venues/schemas/venue.schema';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async getDashboardStats(adminIdStr: string) {
    const adminId = new Types.ObjectId(adminIdStr);

    // 1. Get total venues for this admin
    const venues = await this.venueModel.find({ adminId }).exec();
    const totalVenues = venues.length;
    const venueIds = venues.map((v) => v._id);

    // 2. Get reservations for these venues
    // venueId is stored as String in reservations, so we must query with string versions
    const venueIdStrings = venues.map((v) => v._id.toString());
    const reservations = await this.reservationModel.find({
      venueId: { $in: venueIdStrings },
    }).sort({ createdAt: -1 }).exec();

    // Stats calculation
    let pendingCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0; // also includes canceled

    // 3. Activity data (last 7 days)
    const activityMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = `${date.getDate()} ${date.toLocaleString('az', { month: 'short' })}`; // e.g. 15 Noy
      activityMap[formattedDate] = 0;
    }

    // 5 recent reservations
    const recentBookings = reservations.slice(0, 5).map(r => ({
      _id: r._id,
      userName: r.userName,
      venueName: r.venueName,
      date: r.date,
      time: r.time,
      status: r.status,
      price: r.tierPrice, // Or any calculation needed
    }));

    reservations.forEach((r) => {
      // Counter stats
      if (r.status === 'pending') pendingCount++;
      else if (r.status === 'accepted') acceptedCount++;
      else rejectedCount++;

      // Activity prep: Grouping by strictly `createdAt` if it exists, or `date` of reservation
      const rDate = (r as any).createdAt ? new Date((r as any).createdAt) : new Date();
      // Check if within last 7 days
      const diffTime = Math.abs(today.getTime() - rDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays <= 7) {
        const shortDate = `${rDate.getDate()} ${rDate.toLocaleString('az', { month: 'short' })}`;
        if (activityMap[shortDate] !== undefined) {
          activityMap[shortDate]++;
        }
      }
    });

    // Formatting Activity Map to array
    const activityData = Object.keys(activityMap).map(key => ({
      date: key,
      count: activityMap[key]
    }));

    // Formatting status stats
    const totalReservations = pendingCount + acceptedCount + rejectedCount;
    const statusStats = {
      pending: pendingCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
      total: totalReservations || 1, // prevent division by zero in UI
    };

    return {
      totalVenues,
      pendingReservations: pendingCount,
      acceptedReservations: acceptedCount,
      rejectedReservations: rejectedCount,
      statusStats,
      activityData,
      recentBookings,
    };
  }
}
