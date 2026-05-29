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
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VenuesService } from '../venues/venues.service';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Reservation } from './schemas/reservation.schema';
import { Venue, Layout } from '../venues/schemas/venue.schema';

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
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async handleConnection(client: Socket) {
    let token = client.handshake.auth?.token as string;
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      this.logger.warn(`WS Connection rejected for socket ${client.id}: Token not provided in handshake auth`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub as string;

      // Dynamic privilege validation: check role and status in DB
      const dbUser = await this.userModel
        .findById(userId)
        .select('status role')
        .lean()
        .exec();

      if (!dbUser || dbUser.status !== 'ACTIVE') {
        this.logger.warn(`WS Connection rejected for user ${userId}: User is not active or not found`);
        client.disconnect();
        return;
      }

      const role = dbUser.role;

      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        client.join('admins');

        const adminId = userId;
        if (adminId) {
          try {
            const venues = await this.venuesService.findAll(adminId);
            for (const venue of venues) {
              const venueId = (venue as Venue & { _id: Types.ObjectId })._id.toString();
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

      this.logger.debug(`Secure WS Client connected: ${client.id} | sub: ${userId} | role: ${role}`);
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
  emitNewReservation(reservation: Reservation) {
    const venueId = reservation.venueId?.toString();
    const emitter = venueId
      ? this.server.to(`venue_${venueId}`).to('admins')
      : this.server.to('admins');
    emitter.emit('newReservation', reservation);
  }

  /** Notify admin that a reservation was canceled by the user */
  emitReservationCanceled(reservation: Reservation) {
    const venueId = reservation.venueId?.toString();
    const emitter = venueId
      ? this.server.to(`venue_${venueId}`).to('admins')
      : this.server.to('admins');
    emitter.emit('reservationCanceled', reservation);
  }

  /** Notify a specific user about their reservation status change */
  emitStatusUpdate(userId: string, reservation: Reservation) {
    this.server
      .to(`user_${userId}`)
      .emit('reservationStatusUpdate', reservation);
  }

  /** Broadcast venue status changes to all connected users */
  emitVenueUpdate(venue: Venue & { _id?: unknown }) {
    this.server.emit('venueStatusUpdate', {
      _id: venue._id,
      status: venue.status,
      temporarilyClosed: venue.temporarilyClosed ?? false,
      operatingHours: venue.operatingHours,
    });
  }

  /** Broadcast venue layout (tables) updates to users viewing that venue */
  emitVenueLayoutUpdate(venueId: string, layout: Layout) {
    this.server.to(`venue_${venueId}`).emit('venueLayoutUpdate', {
      venueId,
      layout,
    });
  }

  /** Notify admin that a specific table received a pending reservation — triggers "!" animation */
  emitTablePending(venueId: string, tableId: string, reservation: Reservation & { _id?: Types.ObjectId }) {
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
