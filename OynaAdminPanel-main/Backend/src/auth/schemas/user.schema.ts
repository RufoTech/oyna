import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  passwordHash?: string;

  @Prop()
  displayName: string;

  @Prop()
  photoURL?: string;

  @Prop()
  uid?: string;

  @Prop({ enum: ['ADMIN', 'SUPER_ADMIN', 'USER'], default: 'USER' })
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Venue' }] })
  favorites?: Types.ObjectId[];

  // ── Brevo Auth Fields ──
  @Prop({ enum: ['PENDING', 'ACTIVE'], default: 'ACTIVE' })
  status: 'PENDING' | 'ACTIVE';

  @Prop()
  otpCode?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop()
  resetCode?: string;

  @Prop()
  resetCodeExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
