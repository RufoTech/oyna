import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VenuesService } from '../venues/venues.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ReservationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ReservationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => VenuesService))
    private readonly venuesService: VenuesService,
  ) {}

  async handleConnection(client: Socket) {
    const role = client.handshake.query.role as string;
    const userId = client.handshake.query.userId as string;
    const adminId = client.handshake.query.adminId as string;

    if (role === 'admin') {
      client.join('admins');

      // Join admin to their venue-specific rooms for targeted notifications
      if (adminId) {
        try {
          const venues = await this.venuesService.findAll(adminId);
          for (const venue of venues) {
            const venueId = (venue as any)._id.toString();
            client.join(`venue_${venueId}`);
          }
        } catch (err) {
          this.logger.error(`Failed to join venue rooms for admin ${adminId}: ${err.message}`);
        }
      }
    }

    if (userId) {
      client.join(`user_${userId}`);
      // Also join venue rooms the user might be viewing
      const venueId = client.handshake.query.venueId as string;
      if (venueId) {
        client.join(`venue_${venueId}`);
      }
    }

    this.logger.debug(`Client connected: ${client.id} | role: ${role}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Notify only the admin of the specific venue about a new reservation */
  emitNewReservation(reservation: any) {
    const venueId = reservation.venueId?.toString();
    if (venueId) {
      this.server.to(`venue_${venueId}`).emit('newReservation', reservation);
    } else {
      this.server.to('admins').emit('newReservation', reservation);
    }
  }

  /** Notify admin that a reservation was canceled by the user */
  emitReservationCanceled(reservation: any) {
    const venueId = reservation.venueId?.toString();
    if (venueId) {
      this.server.to(`venue_${venueId}`).emit('reservationCanceled', reservation);
    } else {
      this.server.to('admins').emit('reservationCanceled', reservation);
    }
  }

  /** Notify a specific user about their reservation status change */
  emitStatusUpdate(userId: string, reservation: any) {
    this.server
      .to(`user_${userId}`)
      .emit('reservationStatusUpdate', reservation);
  }

  /** Broadcast venue status changes to users viewing that venue */
  emitVenueUpdate(venue: any) {
    const venueId = venue._id?.toString();
    this.server.to(`venue_${venueId}`).emit('venueStatusUpdate', {
      _id: venue._id,
      status: venue.status,
      temporarilyClosed: venue.temporarilyClosed ?? false,
      operatingHours: venue.operatingHours,
    });
  }

  /** Broadcast venue layout (tables) updates to users viewing that venue */
  emitVenueLayoutUpdate(venueId: string, layout: any) {
    this.server.to(`venue_${venueId}`).emit('venueLayoutUpdate', {
      venueId,
      layout,
    });
  }

  /** Notify admin that a specific table received a pending reservation — triggers "!" animation */
  emitTablePending(venueId: string, tableId: string, reservation: any) {
    const payload = {
      venueId,
      tableId,
      reservationId: reservation._id?.toString(),
      tableName: reservation.tableName,
      userName: reservation.userName,
      time: reservation.time,
    };
    // Send to venue-specific room
    this.server.to(`venue_${venueId}`).emit('tablePendingReservation', payload);
    // Also broadcast to all admins as fallback
    this.server.to('admins').emit('tablePendingReservation', payload);
  }
}
