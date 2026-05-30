import { IsEmail, IsEnum, IsString, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';
import { GeoLocation, Venue, Tier, SpecPackage, LayoutItem } from '../schemas/venue.schema';

export class BlockUserDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsEnum(['block', 'unblock'], { message: 'Fəaliyyət yalnız block və ya unblock ola bilər.' })
  action: 'block' | 'unblock';
}

export class CreateVenueDto {
  @IsString({ message: 'Məkan adı mətn tipli olmalıdır.' })
  name: string;

  @IsString({ message: 'Kateqoriya mətn tipli olmalıdır.' })
  category: string;

  @IsOptional()
  @IsObject()
  location?: GeoLocation;

  @IsOptional()
  @IsObject()
  operatingHours?: Venue['operatingHours'];

  @IsOptional()
  @IsObject()
  contact?: Venue['contact'];

  @IsOptional()
  @IsObject()
  bookingRules?: Venue['bookingRules'];
}

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  location?: GeoLocation;

  @IsOptional()
  @IsObject()
  operatingHours?: Venue['operatingHours'];

  @IsOptional()
  @IsObject()
  contact?: Venue['contact'];

  @IsOptional()
  @IsObject()
  bookingRules?: Venue['bookingRules'];

  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'INACTIVE', 'PUBLISHED'], {
    message: 'Status yalnız DRAFT, ACTIVE, INACTIVE və ya PUBLISHED ola bilər.',
  })
  status?: string;

  @IsOptional()
  @IsBoolean()
  temporarilyClosed?: boolean;
}

export class UpdateSpecsDto {
  @IsOptional()
  @IsArray()
  tiers?: Tier[];

  @IsOptional()
  @IsArray()
  packages?: SpecPackage[];
}

export class UpdateLayoutDto {
  @IsArray()
  items: LayoutItem[];
}
