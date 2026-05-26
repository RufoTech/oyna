import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
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
  private readonly logger = new Logger(AutoRejectTask.name);

  constructor(
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
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const now = new Date();

    // 1. Fetch both expired types in parallel
    const [expiredPending, expiredAwaiting] = await Promise.all([
      this.reservationModel
        .find({ status: 'pending', createdAt: { $lte: tenMinutesAgo } })
        .lean()
        .exec(),
      this.reservationModel
        .find({ status: 'awaiting_arrival', graceDeadline: { $lte: now } })
        .lean()
        .exec(),
    ]);

    if (expiredPending.length === 0 && expiredAwaiting.length === 0) return;

    const pendingRejectReason =
      'Məkan sahibi tərəfindən hər hansı cavab verilmədi. Məkana daxil olub məkan sahibiylə əlaqə saxlaya bilərsiniz.';
    const awaitingRejectReason =
      'Vaxtında gəlmədiyiniz üçün ləğv olundu';

    // 2. Bulk update — single MongoDB operation per status type
    const bulkOps: Promise<any>[] = [];

    if (expiredPending.length > 0) {
      const pendingIds = expiredPending.map((r) => r._id);
      bulkOps.push(
        this.reservationModel.updateMany(
          { _id: { $in: pendingIds } },
          { $set: { status: 'rejected', rejectReason: pendingRejectReason } },
        ),
      );
    }

    if (expiredAwaiting.length > 0) {
      const awaitingIds = expiredAwaiting.map((r) => r._id);
      bulkOps.push(
        this.reservationModel.updateMany(
          { _id: { $in: awaitingIds } },
          { $set: { status: 'no_show', rejectReason: awaitingRejectReason } },
        ),
      );
    }

    await Promise.all(bulkOps);

    // 3. Group by venue for batch table status sync
    const allExpired = [
      ...expiredPending.map((r) => ({ ...r, newStatus: 'rejected' })),
      ...expiredAwaiting.map((r) => ({ ...r, newStatus: 'no_show' })),
    ];

    const venueTableMap = new Map<string, Set<string>>();
    for (const r of allExpired) {
      if (!r.venueId || !r.tableId) continue;
      const vId = r.venueId.toString();
      if (!venueTableMap.has(vId)) venueTableMap.set(vId, new Set());
      venueTableMap.get(vId)!.add(r.tableId);
    }

    // Sync table statuses and emit layout updates per venue (not per reservation)
    for (const [venueId, tableIds] of venueTableMap) {
      for (const tableId of tableIds) {
        await this.venuesService.syncTableStatus(venueId, tableId, 'rejected');
      }
      const updatedLayout = await this.venuesService.getPublicLayout(venueId);
      this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
    }

    // 4. Send notifications in parallel (fire-and-forget with error handling)
    const notifications = allExpired.map((r) => {
      const title = r.newStatus === 'rejected'
        ? '❌ Rezervasiya İmtina Edildi'
        : '⏰ Rezervasiya Ləğv Olundu';
      const reason = r.newStatus === 'rejected' ? pendingRejectReason : awaitingRejectReason;

      // Emit WebSocket updates
      this.reservationsGateway.emitStatusUpdate(r.userId, r);
      this.reservationsGateway.emitReservationCanceled(r);

      // Send FCM push
      return this.pushNotificationService
        .sendToUser(r.userId, title, `${r.venueName} — ${reason}`)
        .catch((err) =>
          this.logger.error(`Push failed for user ${r.userId}: ${err.message}`),
        );
    });

    await Promise.allSettled(notifications);

    if (expiredPending.length > 0) {
      this.logger.log(`Auto-rejected ${expiredPending.length} pending reservation(s)`);
    }
    if (expiredAwaiting.length > 0) {
      this.logger.log(`Auto-no_show ${expiredAwaiting.length} awaiting reservation(s)`);
    }
  }
}
