import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsEnum(['accepted', 'rejected', 'canceled'], {
    message: 'Status yalnız accepted, rejected və ya canceled ola bilər.',
  })
  status: 'accepted' | 'rejected' | 'canceled';

  @IsOptional()
  @IsString({ message: 'İmtina səbəbi mətn tipli olmalıdır.' })
  rejectReason?: string;
}

export class CheckInDto {
  @IsString({ message: 'Rezervasiya nömrəsi mətn tipli olmalıdır.' })
  reservationNumber: string;

  @IsString({ message: 'Məkan ID-si mətn tipli olmalıdır.' })
  venueId: string;
}

export class CreateReservationDto {
  @IsString({ message: 'Məkan ID-si mətn tipli olmalıdır.' })
  venueId: string;

  @IsString({ message: 'Məkan adı mətn tipli olmalıdır.' })
  venueName: string;

  @IsString({ message: 'İstifadəçi adı mətn tipli olmalıdır.' })
  userName: string;

  @IsOptional()
  @IsString({ message: 'İstifadəçi e-maili mətn tipli olmalıdır.' })
  userEmail?: string;

  @IsString({ message: 'Telefon nömrəsi mətn tipli olmalıdır.' })
  userPhone: string;

  @IsString({ message: 'Tarix mətn tipli olmalıdır.' })
  date: string;

  @IsString({ message: 'Vaxt mətn tipli olmalıdır.' })
  time: string;

  @IsOptional()
  @IsString({ message: 'Tier başlığı mətn tipli olmalıdır.' })
  tierTitle?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Tier qiyməti rəqəm tipli olmalıdır.' })
  @Min(0)
  tierPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  tierId?: string;

  // Let client send userId but server will overwrite it using request context
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tableName?: string;
}

export class RegisterFcmTokenDto {
  @IsString({ message: 'FCM Token mətn tipli olmalıdır.' })
  fcmToken: string;
}
