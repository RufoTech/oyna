import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Inject,
  forwardRef,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { ReservationsGateway } from './reservations.gateway';
import { PushNotificationService } from './push-notification.service';
import { VenuesService } from '../venues/venues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthRequest extends Request {
  user: { sub: string; email: string; displayName?: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly reservationsGateway: ReservationsGateway,
    private readonly pushNotificationService: PushNotificationService,
    @Inject(forwardRef(() => VenuesService))
    private readonly venuesService: VenuesService,
  ) { }

  /** GET /reservations — Admin gets only their venue's reservations */
  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const adminId = req.user.sub;
    const venues = await this.venuesService.findAll(adminId);
    const venueIds = venues.map((v: any) => v._id.toString());
    
    // Convert to numbers, defaults to 1 and 10
    const p = page ? parseInt(page) || 1 : 1;
    const l = limit ? parseInt(limit) || 10 : 10;
    
    return this.reservationsService.findByAdminPaginated(venueIds, p, l, search);
  }

  /** GET /reservations/export — Export reservations for a given period */
  @Get('export')
  async exportReservations(
    @Req() req: AuthRequest,
    @Query('period') period?: string,
  ) {
    const adminId = req.user.sub;
    const venues = await this.venuesService.findAll(adminId);
    const venueIds = venues.map((v: any) => v._id.toString());
    const validPeriod = ['1m', '3m', '6m', '1y'].includes(period || '') ? period as any : '1m';
    return this.reservationsService.findByAdminForExport(venueIds, validPeriod);
  }

  /** PATCH /reservations/:id/status — Admin updates status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'accepted' | 'rejected' | 'canceled'; rejectReason?: string },
    @Req() req: AuthRequest,
  ) {
    const adminId = req.user.sub;
    const originalReservation = await this.reservationsService.findOne(id);
    if (!originalReservation) {
      throw new ForbiddenException('Rezervasiya tapılmadı.');
    }

    // Check if admin has access to the reservation's venue
    if (originalReservation.venueId) {
      const venues = await this.venuesService.findAll(adminId);
      const hasVenue = venues.some((v: any) => v._id.toString() === originalReservation.venueId.toString());
      if (!hasVenue) {
        throw new ForbiddenException('Bu məkana daxil olmağa hüququnuz yoxdur.');
      }
    }

    let finalStatus: any = body.status;
    let graceDeadline: Date | undefined;

    if (body.status === 'accepted') {
      finalStatus = 'awaiting_arrival';
      try {
        if (originalReservation.venueId) {
          const venue = await this.venuesService.findOnePublic(originalReservation.venueId.toString());
          const gracePeriod = venue?.bookingRules?.gracePeriod ?? 30; // Default 30 min as requested
          graceDeadline = this.reservationsService.calculateGraceDeadline(
            originalReservation.date,
            originalReservation.time,
            gracePeriod,
          );
        }
      } catch (e) {
        console.error('Error fetching venue for grace period', e);
      }
    }

    const updated = await this.reservationsService.updateStatus(
      id,
      finalStatus,
      body.rejectReason,
      graceDeadline,
    );

    // Emit real-time status update to the user who made the reservation
    const reservation = updated as any;
    this.reservationsGateway.emitStatusUpdate(
      reservation.userId,
      reservation,
    );

    // Send FCM push notification (works even if app is killed)
    if (body.status === 'accepted') {
      this.pushNotificationService.sendToUser(
        reservation.userId,
        '✅ Qəbul edildi!',
        `${reservation.venueName} sizi ${reservation.time}-da gözləyir.`,
      );
    } else if (body.status === 'rejected') {
      const reason = body.rejectReason ? `\nSəbəb: ${body.rejectReason}` : '';
      this.pushNotificationService.sendToUser(
        reservation.userId,
        '❌ Rezervasiya İmtina Edildi',
        `${reservation.venueName} müraciətinizi rədd etdi.${reason}`,
      );
    }

    // Sync table status in venue layout + broadcast to all clients
    if (reservation.tableId && reservation.venueId) {
      const venueId = reservation.venueId.toString();
      await this.venuesService.syncTableStatus(venueId, reservation.tableId, finalStatus);
      const updatedLayout = await this.venuesService.getPublicLayout(venueId);
      this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
    }

    return updated;
  }

  /** PATCH /reservations/check-in — Admin checks in a user via reservation number */
  @Patch('check-in')
  async checkIn(
    @Req() req: AuthRequest,
    @Body() body: { reservationNumber: string; venueId: string },
  ) {
    const adminId = req.user.sub;
    
    // Check if admin has access to this venue
    const venues = await this.venuesService.findAll(adminId);
    const hasVenue = venues.some((v: any) => v._id.toString() === body.venueId);
    
    if (!hasVenue) {
      throw new ForbiddenException('Bu məkana daxil olmağa hüququnuz yoxdur.');
    }

    const updated = await this.reservationsService.checkIn(body.reservationNumber, body.venueId);

    // Emit real-time status update to the user who made the reservation
    const reservation = updated as any;
    this.reservationsGateway.emitStatusUpdate(
      reservation.userId,
      reservation,
    );

    this.pushNotificationService.sendToUser(
      reservation.userId,
      '🎮 Xoş gəldiniz!',
      `${reservation.venueName} — Seansınız başladı. Uğurlar!`,
    );

    // Sync table status to 'occupied' after check-in
    if (reservation.tableId && reservation.venueId) {
      const venueId = reservation.venueId.toString();
      await this.venuesService.syncTableStatus(venueId, reservation.tableId, 'arrived');
      const updatedLayout = await this.venuesService.getPublicLayout(venueId);
      this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
    }

    return updated;
  }
}
