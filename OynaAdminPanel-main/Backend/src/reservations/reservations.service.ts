import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import { VenuesService } from '../venues/venues.service';
import {
  Reservation,
  ReservationDocument,
} from './schemas/reservation.schema';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @Inject(forwardRef(() => VenuesService))
    private venuesService: VenuesService,
  ) { }

  private generateReservationNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like O, 0, I, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
      const randIdx = crypto.randomInt(0, chars.length);
      result += chars.charAt(randIdx);
    }
    return `#${result}`;
  }

  /** Create a new reservation (from Flutter app) with duplicate checks */
  async create(dto: Partial<Reservation>): Promise<Reservation> {
    const userId = dto.userId;
    const userEmail = dto.userEmail;

    if (dto.venueId && userEmail) {
      const venue = await this.venuesService.findOnePublic(dto.venueId.toString());
      if (venue && venue.blockedUsers && venue.blockedUsers.includes(userEmail)) {
        throw new ConflictException('USER_BLOCKED_BY_VENUE');
      }
    }

    // Check if user has ANY pending reservation
    const existingPending = await this.reservationModel.findOne({
      userId,
      status: 'pending',
    }).lean().exec();

    if (existingPending) {
      const existingVenueId = existingPending.venueId?.toString();
      const newVenueId = dto.venueId?.toString();

      if (existingVenueId === newVenueId) {
        // Same venue — block
        throw new ConflictException(
          'SAME_VENUE_PENDING',
        );
      } else {
        // Different venue — block
        throw new ConflictException(
          'OTHER_VENUE_PENDING',
        );
      }
    }

    // Attach unique reservation number
    dto.reservationNumber = this.generateReservationNumber();

    const created = new this.reservationModel(dto);
    return created.save();
  }

  /** Get all reservations for a specific venue (admin use) */
  async findByVenue(venueId: string, page: number = 1, limit: number = 100): Promise<Reservation[]> {
    const skip = (page - 1) * limit;
    return this.reservationModel
      .find({ venueId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  /** Get all reservations for an admin's venues */
  async findByAdmin(adminVenueIds: string[], page: number = 1, limit: number = 100): Promise<Reservation[]> {
    const skip = (page - 1) * limit;
    return this.reservationModel
      .find({ venueId: { $in: adminVenueIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  /** Get paginated reservations for an admin's venues with optional search */
  async findByAdminPaginated(
    adminVenueIds: string[],
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ reservations: Reservation[], pagination: { totalCount: number, totalPages: number, currentPage: number, limit: number } }> {
    const query: mongoose.QueryFilter<ReservationDocument> = { venueId: { $in: adminVenueIds } };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&');
      query.$or = [
        { userName: { $regex: escapedSearch, $options: 'i' } },
        { userPhone: { $regex: escapedSearch, $options: 'i' } },
        { reservationNumber: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [reservations, totalCount] = await Promise.all([
      this.reservationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reservationModel.countDocuments(query).exec()
    ]);

    return {
      reservations,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        currentPage: page,
        limit
      }
    };
  }

  /** Get all reservations for an admin's venues within a date period (for export) */
  async findByAdminForExport(
    adminVenueIds: string[],
    period: '1d' | '1m' | '3m' | '6m' | '1y',
  ): Promise<Reservation[]> {
    const now = new Date();
    let from: Date;

    if (period === '1d') {
      // Start of today (00:00:00) in local timezone
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      const periodMap = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
      const months = periodMap[period as '1m' | '3m' | '6m' | '1y'] || 1;
      from = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    }

    return this.reservationModel
      .find({
        venueId: { $in: adminVenueIds },
        createdAt: { $gte: from },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  /** Get all reservations — for single-venue admins we fetch all for their venue */
  async findAll(page: number = 1, limit: number = 100): Promise<Reservation[]> {
    const skip = (page - 1) * limit;
    return this.reservationModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  /** Get reservations for a specific user (Flutter app) */
  async findByUser(userId: string, page = 1, limit = 10): Promise<Reservation[]> {
    const skip = (page - 1) * limit;
    return this.reservationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  /** Get unique venue IDs from accepted reservations for a specific user */
  async findDiscoveredVenueIds(userId: string): Promise<string[]> {
    const venueIds = await this.reservationModel.distinct('venueId', {
      userId,
      status: 'accepted'
    }).exec();
    return venueIds.map(id => id.toString());
  }

  /** Update the status of a reservation (admin or user action) */
  async updateStatus(
    id: string,
    status: 'accepted' | 'rejected' | 'canceled' | 'awaiting_arrival' | 'arrived' | 'no_show',
    rejectReason?: string,
    graceDeadline?: Date,
  ): Promise<Reservation> {
    const updateData: mongoose.UpdateQuery<ReservationDocument> = { status };
    if (rejectReason) {
      updateData.rejectReason = rejectReason;
    }
    if (graceDeadline) {
      updateData.graceDeadline = graceDeadline;
    }
    if (status === 'arrived') {
      updateData.checkedInAt = new Date();
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Rezervasiya tapılmadı.');
    }
    return updated;
  }

  /** Check-in a reservation by its reservation number (admin scans/types the code) */
  async checkIn(reservationNumber: string, venueId: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findOne({
      reservationNumber,
      venueId,
      status: 'awaiting_arrival',
    }).exec();

    if (!reservation) {
      throw new NotFoundException('Bu kod ilə gəliş gözlənilən rezervasiya tapılmadı.');
    }

    reservation.status = 'arrived';
    reservation.checkedInAt = new Date();
    return reservation.save();
  }

  /** Calculate grace deadline from reservation date/time + grace period minutes */
  calculateGraceDeadline(date: string, time: string, gracePeriodMinutes: number): Date {
    // date = "2026-05-19", time = "18:00"
    const [hours, minutes] = time.split(':').map(Number);
    const deadline = new Date(`${date}T${time}:00`);
    deadline.setMinutes(deadline.getMinutes() + gracePeriodMinutes);
    return deadline;
  }

  /** Get a single reservation by ID */
  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).lean().exec();
    if (!reservation) {
      throw new NotFoundException('Rezervasiya tapılmadı.');
    }
    return reservation as unknown as Reservation;
  }

  /** Auto-reject pending reservations older than 10 minutes */
  async autoRejectExpired(): Promise<number> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const result = await this.reservationModel.updateMany(
      { status: 'pending', createdAt: { $lte: tenMinutesAgo } },
      {
        $set: {
          status: 'rejected',
          rejectReason:
            'Məkan sahibi tərəfindən hər hansı cavab verilmədi. Məkana daxil olub məkan sahibiylə əlaqə saxlaya bilərsiniz.',
        },
      },
    );

    return result.modifiedCount;
  }

  /** Find awaiting_arrival reservations whose grace deadline has passed */
  async findExpiredAwaiting(): Promise<Reservation[]> {
    const now = new Date();
    return this.reservationModel
      .find({
        status: 'awaiting_arrival',
        graceDeadline: { $lte: now },
      })
      .lean()
      .exec() as unknown as Reservation[];
  }
}
