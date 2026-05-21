import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Types.ObjectId;

  @Prop({ unique: true, sparse: true })
  reservationNumber?: string;

  @Prop({ required: true })
  venueName: string;

  @Prop({ required: true })
  userId: string; // Firebase UID

  @Prop({ required: true })
  userName: string;

  @Prop()
  userEmail: string;

  @Prop({ required: true })
  userPhone: string;

  @Prop({ required: true })
  date: string; // e.g. "2026-04-17"

  @Prop({ required: true })
  time: string; // e.g. "19:30"

  @Prop()
  tierTitle: string;

  @Prop({ default: 0 })
  tierPrice: number;

  @Prop()
  description: string;

  @Prop()
  tableId?: string; // Simulation layout item ID (e.g. "obj_1716123456_1234")

  @Prop()
  tableName?: string; // Human-readable table name (e.g. "Standart PC 3")

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'awaiting_arrival', 'arrived', 'rejected', 'canceled', 'no_show'],
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'awaiting_arrival' | 'arrived' | 'rejected' | 'canceled' | 'no_show';

  @Prop()
  rejectReason?: string;

  @Prop()
  checkedInAt?: Date;

  @Prop()
  graceDeadline?: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
