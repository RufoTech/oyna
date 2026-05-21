import { Controller, Get, Post, Body, Query, Patch, Param, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsGateway } from './reservations.gateway';
import { PushNotificationService } from './push-notification.service';
import { Reservation } from './schemas/reservation.schema';
import { VenuesService } from '../venues/venues.service';
import { RedisService } from '../redis/redis.service';

/**
 * Public endpoints for the Flutter mobile app.
 * No JWT guard — Firebase-authenticated users call these.
 */
@Controller('public/reservations')
export class PublicReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly reservationsGateway: ReservationsGateway,
    private readonly pushNotificationService: PushNotificationService,
    @Inject(forwardRef(() => VenuesService))
    private readonly venuesService: VenuesService,
    private readonly redisService: RedisService,
  ) {}

  private isVenueOpenByClock(venue: any): boolean {
    if (!venue.operatingHours) return true;
    if (venue.operatingHours.is24_7) return true;

    const now = new Date();
    // JS getDay() is 0-6 (Sun-Sat). We need mapping.
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayStr = weekdays[now.getDay()];
    
    // Safety check because sometimes schedule is a Map vs Object
    const schedule = venue.operatingHours.schedule;
    if (!schedule) return true;
    
    const daySchedule = schedule instanceof Map ? schedule.get(todayStr) : schedule[todayStr];
    
    if (!daySchedule || daySchedule.closed) return false;
    if (!daySchedule.open || !daySchedule.close) return true;

    try {
      const openParts = daySchedule.open.split(':');
      const closeParts = daySchedule.close.split(':');
      const openTime = parseInt(openParts[0], 10) * 60 + parseInt(openParts[1], 10);
      const closeTime = parseInt(closeParts[0], 10) * 60 + parseInt(closeParts[1], 10);
      const nowTime = now.getHours() * 60 + now.getMinutes();

      if (daySchedule.isNextDay || closeTime < openTime) {
        if (nowTime >= openTime || nowTime <= closeTime) return true;
      } else {
        if (nowTime >= openTime && nowTime <= closeTime) return true;
      }
      return false;
    } catch (e) {
      return true;
    }
  }

  /** POST /public/reservations — Create a new reservation */
  @Post()
  async create(@Body() dto: Partial<Reservation> & { tableId?: string; tierId?: string }) {
    // Server-side guard: check venue is still accepting reservations
    if (dto.venueId) {
      const venue = await this.venuesService.findOnePublic(dto.venueId.toString());

      if (venue.temporarilyClosed) {
        throw new ForbiddenException('VENUE_TEMPORARILY_CLOSED');
      }

      if (venue.status === 'INACTIVE') {
        throw new ForbiddenException('VENUE_NOT_ACCEPTING');
      }

      if (!this.isVenueOpenByClock(venue)) {
        throw new ForbiddenException('VENUE_CLOSED_BY_CLOCK');
      }
    }

    // ═══════════════════════════════════════════════
    // TABLE ASSIGNMENT LOGIC WITH DISTRIBUTED LOCK
    // ═══════════════════════════════════════════════
    const venueId = dto.venueId?.toString();
    let acquiredLockKey: string | null = null;

    try {
      if (dto.tableId && venueId) {
        // YOL 1: User xəritədən masa seçib — validate that table is available
        const lockKey = `table_lock:${venueId}:${dto.tableId}`;
        const acquired = await this.redisService.acquireLock(lockKey, 15);
        if (!acquired) {
          throw new ForbiddenException('TABLE_BEING_RESERVED');
        }
        acquiredLockKey = lockKey;

        const layout = await this.venuesService.getPublicLayout(venueId);
        const table = (layout?.items || []).find((item: any) => item.id === dto.tableId);
        
        if (!table) {
          throw new ForbiddenException('TABLE_NOT_FOUND');
        }
        if (table.status !== 'available') {
          throw new ForbiddenException('TABLE_NOT_AVAILABLE');
        }
        
        dto.tableName = table.name;
      } else if (dto.tierId && venueId) {
        // YOL 2: User xidmət düyməsindən seçib — random boş masa tap (preventing race condition via retries)
        let lockedTable: any = null;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
          const randomTable = await this.venuesService.findRandomAvailableTable(venueId, dto.tierId, dto.tierTitle);
          if (!randomTable) {
            throw new ForbiddenException('NO_AVAILABLE_TABLE');
          }

          const lockKey = `table_lock:${venueId}:${randomTable.id}`;
          const acquired = await this.redisService.acquireLock(lockKey, 15);
          if (acquired) {
            lockedTable = randomTable;
            acquiredLockKey = lockKey;
            break;
          }
        }

        if (!lockedTable) {
          throw new ForbiddenException('TABLE_BEING_RESERVED');
        }

        dto.tableId = lockedTable.id;
        dto.tableName = lockedTable.name;
      }
      
      // tierId-ni reservation-a saxlamağa ehtiyac yoxdur, silinir
      delete (dto as any).tierId;

      const reservation = await this.reservationsService.create(dto);

      // Sync table status to 'reserved' in venue layout
      if (reservation.tableId && venueId) {
        await this.venuesService.syncTableStatus(venueId, reservation.tableId, 'pending');
        const updatedLayout = await this.venuesService.getPublicLayout(venueId);
        this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
      }

      // Emit real-time notification to admins (includes tableId for "!" animation)
      this.reservationsGateway.emitNewReservation(reservation);

      // Emit table-specific pending notification for Simulation "!" animation
      if (reservation.tableId && venueId) {
        this.reservationsGateway.emitTablePending(venueId, reservation.tableId, reservation);
      }

      return reservation;
    } finally {
      if (acquiredLockKey) {
        await this.redisService.releaseLock(acquiredLockKey);
      }
    }
  }

  /** GET /public/reservations/discovered?userId=xxx — Get user's discovered venues */
  @Get('discovered')
  async findDiscoveredVenues(@Query('userId') userId: string) {
    const venueIds = await this.reservationsService.findDiscoveredVenueIds(userId);
    if (!venueIds.length) return [];
    return this.venuesService.findManyPublic(venueIds);
  }

  /** GET /public/reservations?userId=xxx&page=1&limit=10 — Get user's own reservations */
  @Get()
  findByUser(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.reservationsService.findByUser(userId, pageNum, limitNum);
  }

  /** PATCH /public/reservations/:id/cancel — User cancels a reservation */
  @Patch(':id/cancel')
  async cancelReservation(@Param('id') id: string) {
    // First get the reservation to know the tableId
    const existing = await this.reservationsService.findOne(id);

    const updated = await this.reservationsService.updateStatus(
      id,
      'canceled',
      'İstifadəçi rezervasiyanı ləğv etdi.',
    );

    // Sync table back to available
    if (existing?.tableId && existing?.venueId) {
      const venueId = existing.venueId.toString();
      await this.venuesService.syncTableStatus(venueId, existing.tableId, 'canceled');
      const updatedLayout = await this.venuesService.getPublicLayout(venueId);
      this.reservationsGateway.emitVenueLayoutUpdate(venueId, updatedLayout);
    }

    // Emit real-time cancellation notification to admins
    this.reservationsGateway.emitReservationCanceled(updated);

    return updated;
  }

  /** POST /public/reservations/register-token — Register FCM device token */
  @Post('register-token')
  async registerToken(@Body() body: { userId: string; fcmToken: string }) {
    await this.pushNotificationService.registerToken(body.userId, body.fcmToken);
    return { success: true };
  }
}
