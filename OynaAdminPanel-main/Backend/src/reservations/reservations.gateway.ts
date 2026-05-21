import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
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
            console.log(`Admin ${adminId} joined room: venue_${venueId}`);
          }
        } catch (err) {
          console.error(`Failed to join venue rooms for admin ${adminId}:`, err.message);
        }
      }
    }

    if (userId) {
      client.join(`user_${userId}`);
    }

    console.log(
      `Client connected: ${client.id} | role: ${role} | userId: ${userId} | adminId: ${adminId}`,
    );
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /** Notify only the admin of the specific venue about a new reservation */
  emitNewReservation(reservation: any) {
    const venueId = reservation.venueId?.toString();
    if (venueId) {
      // Send to the specific venue's admin room
      this.server.to(`venue_${venueId}`).emit('newReservation', reservation);
      console.log(`📢 Reservation notification sent to venue_${venueId} room`);
    } else {
      // Fallback: if venueId is missing, broadcast to all admins (shouldn't happen)
      this.server.to('admins').emit('newReservation', reservation);
      console.warn('⚠️ Reservation without venueId — broadcasting to all admins');
    }
  }

  /** Notify admin that a reservation was canceled by the user */
  emitReservationCanceled(reservation: any) {
    const venueId = reservation.venueId?.toString();
    if (venueId) {
      this.server.to(`venue_${venueId}`).emit('reservationCanceled', reservation);
      console.log(`📢 Cancellation notification sent to venue_${venueId} room`);
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

  /** Broadcast venue status changes to ALL connected users in real-time */
  emitVenueUpdate(venue: any) {
    this.server.emit('venueStatusUpdate', {
      _id: venue._id,
      status: venue.status,
      temporarilyClosed: venue.temporarilyClosed ?? false,
      operatingHours: venue.operatingHours,
    });
  }

  /** Broadcast venue layout (tables) updates to ALL connected users in real-time */
  emitVenueLayoutUpdate(venueId: string, layout: any) {
    this.server.emit('venueLayoutUpdate', {
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
    console.log(`📢 Table pending notification: ${tableId} in venue_${venueId}`);
  }
}
