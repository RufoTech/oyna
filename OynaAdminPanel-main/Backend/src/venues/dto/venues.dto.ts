import { IsEmail, IsEnum } from 'class-validator';

export class BlockUserDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsEnum(['block', 'unblock'], { message: 'Fəaliyyət yalnız block və ya unblock ola bilər.' })
  action: 'block' | 'unblock';
}
