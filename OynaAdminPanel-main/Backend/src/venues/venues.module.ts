import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { PublicVenuesController } from './public-venues.controller';
import { Venue, VenueSchema } from './schemas/venue.schema';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Venue.name, schema: VenueSchema }]),
    forwardRef(() => ReservationsModule),
  ],
  controllers: [VenuesController, PublicVenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
