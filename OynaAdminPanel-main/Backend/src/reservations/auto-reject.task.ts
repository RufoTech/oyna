import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';
import { ReservationsGateway } from './reservations.gateway';
import { PushNotificationService } from './push-notification.service';
import { VenuesService } from '../venues/venues.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Reservation,
  ReservationDocument,
} from './schemas/reservation.schema';

@Injectable()
export class AutoRejectTask {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly reservationsGateway: ReservationsGateway,
    private readonly pushNotificationService: PushNotificationService,
    @Inject(forwardRef(() => VenuesService))
    private readonly venuesService: VenuesService,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  /** Runs every 30 seconds — checks and auto-rejects expired pending reservations */
  @Interval(30_000)
  async handleAutoReject() {
    // Existing logic for pending reservations
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const expiredReservations = await this.reservationModel
      .find({
        status: 'pending',
        createdAt: { $lte: tenMinutesAgo },
      })
      .exec();

    for (const reservation of expiredReservations) {
      const rejectReason =
        'Məkan sahibi tərəfindən hər hansı cavab verilmədi. Məkana daxil olub məkan sahibiylə əlaqə saxlaya bilərsiniz.';

      reservation.status = 'rejected';
      reservation.rejectReason = rejectReason;
      await reservation.save();

      // Clear the table from the simulation view map
      if (reservation.venueId && reservation.tableId) {
        const venueId = reservation.venueId.toString();
        await this.venuesService.syncTableStatus(venueId, reservation.tableId, 'rejected');
        const updatedLayout = await this.venuesService.getPublicLayout(venueId);
        this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
      }

      // Notify user via Socket.io
      this.reservationsGateway.emitStatusUpdate(
        reservation.userId,
        reservation,
      );

      // Notify user via FCM push (even if app is killed)
      this.pushNotificationService.sendToUser(
        reservation.userId,
        '❌ Rezervasiya İmtina Edildi',
        `${reservation.venueName} — ${rejectReason}`,
      );

      // Notify admin panel to refresh
      this.reservationsGateway.emitReservationCanceled(reservation);

      console.log(
        `Auto-rejected pending reservation ${(reservation as any)._id} for user ${reservation.userId}`,
      );
    }

    // NEW logic for no_show reservations (grace period expired)
    const now = new Date();
    const expiredAwaiting = await this.reservationModel
      .find({
        status: 'awaiting_arrival',
        graceDeadline: { $lte: now },
      })
      .exec();

    for (const reservation of expiredAwaiting) {
      const rejectReason = 'Vaxtında gəlmədiyiniz üçün ləğv olundu'; // Required by user

      reservation.status = 'no_show';
      reservation.rejectReason = rejectReason;
      await reservation.save();

      // Clear the table from the simulation view map
      if (reservation.venueId && reservation.tableId) {
        const venueId = reservation.venueId.toString();
        await this.venuesService.syncTableStatus(venueId, reservation.tableId, 'no_show');
        const updatedLayout = await this.venuesService.getPublicLayout(venueId);
        this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
      }

      // Notify user via Socket.io
      this.reservationsGateway.emitStatusUpdate(
        reservation.userId,
        reservation,
      );

      // Notify user via FCM push
      this.pushNotificationService.sendToUser(
        reservation.userId,
        '⏰ Rezervasiya Ləğv Olundu',
        `${reservation.venueName} — ${rejectReason}`,
      );

      // Notify admin panel to refresh
      this.reservationsGateway.emitReservationCanceled(reservation);

      console.log(
        `Auto-no_show reservation ${(reservation as any)._id} for user ${reservation.userId}`,
      );
    }
  }
}
