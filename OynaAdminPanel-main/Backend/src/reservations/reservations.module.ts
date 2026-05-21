import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PublicReservationsController } from './public-reservations.controller';
import { ReservationsGateway } from './reservations.gateway';
import { PushNotificationService } from './push-notification.service';
import { AutoRejectTask } from './auto-reject.task';
import {
  Reservation,
  ReservationSchema,
} from './schemas/reservation.schema';
import {
  DeviceToken,
  DeviceTokenSchema,
} from './schemas/device-token.schema';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
    forwardRef(() => VenuesModule),
  ],
  controllers: [ReservationsController, PublicReservationsController],
  providers: [
    ReservationsService,
    ReservationsGateway,
    PushNotificationService,
    AutoRejectTask,
  ],
  exports: [ReservationsService, ReservationsGateway],
})
export class ReservationsModule {}
