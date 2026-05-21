import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VenueDocument = Venue & Document;

// ── Sub-schemas for Specs (Step 4) ──

@Schema({ _id: false })
class HardwareItem {
  @Prop() category: string;
  @Prop() name: string;
  @Prop() description: string;
  @Prop() icon: string;
}

@Schema({ _id: false })
class AccessoryItem {
  @Prop() category: string;
  @Prop() name: string;
  @Prop() description: string;
  @Prop() icon: string;
}

@Schema({ _id: false })
class FeatureItem {
  @Prop() text: string;
  @Prop() icon: string;
}

@Schema({ _id: false })
class Tier {
  @Prop() id: string; // client-generated stable id — referenced by LayoutItem.tierId
  @Prop() type: string; // 'pc' | 'playstation'
  @Prop() title: string;
  @Prop() price: number; // Fixed: string -> number
  @Prop() shortSpec: string;
  @Prop() icon: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop() heroImage: string;
  @Prop({ type: [HardwareItem], default: [] }) hardware: HardwareItem[]; // Fixed: Specific hardware per tier
  @Prop({ type: [AccessoryItem], default: [] }) accessories: AccessoryItem[];
  @Prop({ type: [FeatureItem], default: [] }) features: FeatureItem[];
}

@Schema({ _id: false })
class SpecPackage {
  @Prop({ required: true }) title: string; // Fixed: Required title for robustness
  @Prop() description: string;
  @Prop() price: number; // Fixed: string -> number
  @Prop({ default: false }) hasDiscount: boolean;
  @Prop({
    type: Number,
    validate: {
      validator: function (this: any, v: number) {
        // validate discountPrice < price
        const price = this.price;
        return typeof v !== 'number' || typeof price !== 'number' || v <= price;
      },
      message: 'Discount price cannot be greater than base price.',
    },
  })
  discountPrice: number; // Fixed: string -> number with validation
}

@Schema({ _id: false })
class Specs {
  @Prop() pageTitle: string;
  @Prop() pageSubtitle: string;
  @Prop({ type: [Tier], default: [] }) tiers: Tier[];
  @Prop({ type: [SpecPackage], default: [] }) packages: SpecPackage[];
}

// ── Sub-schemas for Layout (Floor-plan simulator) ──

@Schema({ _id: false })
class LayoutItem {
  @Prop({ required: true }) id: string; // client-generated stable id
  @Prop({ required: true }) type: string; // 'pc' | 'playstation' | 'cabinet'
  @Prop() tierId?: string; // references Tier.id for PC items
  @Prop() name?: string;
  @Prop({ required: true }) x: number;
  @Prop({ required: true }) y: number;
  @Prop({ required: true }) w: number;
  @Prop({ required: true }) h: number;
  @Prop({ default: 0 }) r: number;
  @Prop({
    type: String,
    enum: ['available', 'reserved', 'occupied', 'disabled'],
    default: 'available',
  })
  status: string;
  @Prop({ default: null, type: String }) cabinetId: string | null;
  @Prop({ type: [String], default: [] }) connectedTo: string[];
  @Prop({ default: 0 }) price: number;
  @Prop({ default: 0 }) capacity: number;
}

@Schema({ _id: false })
class Layout {
  @Prop({ type: [LayoutItem], default: [] }) items: LayoutItem[];
  @Prop() updatedAt?: Date;
}

// ── Sub-schemas for Base Info ──
@Schema({ _id: false })
export class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true, default: [0, 0] }) // [longitude, latitude]
  coordinates: number[];

  @Prop() city: string;
  @Prop() address: string;
}

@Schema({ _id: false })
class MediaGalleryItem {
  @Prop({ required: true }) url: string;
  @Prop({ default: false }) isPrimary: boolean;
  @Prop({ enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' }) type: string;
}

@Schema({ _id: false })
class OperatingScheduleDay {
  @Prop() open: string;
  @Prop() close: string;
  @Prop({ default: false }) closed: boolean;
  @Prop({ default: false }) isNextDay: boolean; // Fixed: Track next-day transitions (e.g. 02:00)
}

// ── Main Venue Schema ──

@Schema({ timestamps: true }) // Fixed: Built-in timezone consistency handling
export class Venue {
  @Prop({
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'PUBLISHED'],
    default: 'DRAFT',
  })
  status: string; // Fixed: Enforce valid statuses

  @Prop({ default: false })
  temporarilyClosed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  adminId: Types.ObjectId;

  // Step 1: General Info & Location
  @Prop() logo?: string;
  @Prop() name?: string;
  @Prop() category?: string;
  @Prop() slogan?: string;
  @Prop() description?: string;

  @Prop({ type: GeoLocation })
  location?: GeoLocation; // Fixed: Structured point data

  @Prop({ type: [String], default: [] })
  branches?: string[];

  // Step 2: Media & Pricing
  @Prop({ type: Object })
  media?: {
    heroImage: MediaGalleryItem;
    gallery: MediaGalleryItem[]; // Fixed: Objects instead of string array for media metadata
  };

  @Prop({ type: Object })
  pricing?: {
    basePrice: number;
    peakPricingEnabled: boolean;
  };

  @Prop([String])
  amenities?: string[];

  // Step 3: Calendar & Config
  @Prop({ type: Object })
  operatingHours?: {
    is24_7: boolean;
    schedule: Record<string, OperatingScheduleDay>;
  };

  @Prop({
    type: Object,
    validate: {
      validator: function (v: any) {
        if (!v || !v.email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v.email);
      },
      message: 'Invalid email format',
    },
  })
  contact?: {
    phone: string;
    email: string;
    instagram: string;
    whatsapp: string;
    website: string;
  };

  @Prop({ type: Object })
  bookingRules?: {
    minTimeMinutes: number; // Fixed: number rather than string
    maxTimeMinutes: number;
    gracePeriod: number;
  };

  // Step 4: Specs (Tiers, Packages, etc.)
  @Prop({ type: [String], default: [] })
  blockedUsers?: string[];


  @Prop({ type: Specs, default: {} })
  specs?: Specs;

  // Step 5: Floor-plan / Simulation layout
  @Prop({ type: Layout, default: { items: [] } })
  layout?: Layout;
}

export const VenueSchema = SchemaFactory.createForClass(Venue);

// Creates geospatial 2dsphere index for nearby searching via map
VenueSchema.index({ 'location.coordinates': '2dsphere' });
