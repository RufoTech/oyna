import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
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
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(`WS Connection rejected for socket ${client.id}: Token not provided`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const role = payload.role as string;
      const userId = payload.sub as string;

      if (role === 'ADMIN' || role === 'SUPER_ADMIN' || client.handshake.query?.role === 'admin') {
        client.join('admins');

        const adminId = payload.sub;
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
      } else {
        // Regular user
        client.join(`user_${userId}`);
        
        // Join venue room if the client is currently viewing it
        const venueId = client.handshake.query?.venueId as string;
        if (venueId) {
          client.join(`venue_${venueId}`);
        }
      }

      this.logger.debug(`Secure WS Client connected: ${client.id} | sub: ${payload.sub} | role: ${payload.role}`);
    } catch (err) {
      this.logger.warn(`WS Connection rejected for socket ${client.id}: Invalid token - ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinVenue')
  handleJoinVenue(
    @ConnectedSocket() client: Socket,
    @MessageBody() venueId: string,
  ) {
    if (venueId) {
      client.join(`venue_${venueId}`);
      this.logger.debug(`Client ${client.id} joined room: venue_${venueId}`);
    }
  }

  @SubscribeMessage('leaveVenue')
  handleLeaveVenue(
    @ConnectedSocket() client: Socket,
    @MessageBody() venueId: string,
  ) {
    if (venueId) {
      client.leave(`venue_${venueId}`);
      this.logger.debug(`Client ${client.id} left room: venue_${venueId}`);
    }
  }

  /** Notify admin about a new reservation — venue room + admins fallback */
  emitNewReservation(reservation: any) {
    const venueId = reservation.venueId?.toString();
    const emitter = venueId
      ? this.server.to(`venue_${venueId}`).to('admins')
      : this.server.to('admins');
    emitter.emit('newReservation', reservation);
  }

  /** Notify admin that a reservation was canceled by the user */
  emitReservationCanceled(reservation: any) {
    const venueId = reservation.venueId?.toString();
    const emitter = venueId
      ? this.server.to(`venue_${venueId}`).to('admins')
      : this.server.to('admins');
    emitter.emit('reservationCanceled', reservation);
  }

  /** Notify a specific user about their reservation status change */
  emitStatusUpdate(userId: string, reservation: any) {
    this.server
      .to(`user_${userId}`)
      .emit('reservationStatusUpdate', reservation);
  }

  /** Broadcast venue status changes to all connected users */
  emitVenueUpdate(venue: any) {
    this.server.emit('venueStatusUpdate', {
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
    // Send to venue room + admins fallback (chain deduplicates for sockets in both)
    this.server.to(`venue_${venueId}`).to('admins').emit('tablePendingReservation', payload);
  }
}
