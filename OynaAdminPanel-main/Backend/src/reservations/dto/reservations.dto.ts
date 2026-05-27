import { IsString, IsEnum, IsOptional } from 'class-validator';

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
