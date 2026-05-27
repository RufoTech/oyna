import { IsEmail, IsString, MinLength, MaxLength, Length } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'Şifrə mətn tipli olmalıdır.' })
  password: string;
}

export class CreateAdminDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'Şifrə mətn tipli olmalıdır.' })
  @MinLength(8, { message: 'Şifrə ən az 8 simvol olmalıdır.' })
  password: string;

  @IsString({ message: 'Ad mətn tipli olmalıdır.' })
  @MinLength(2, { message: 'Ad ən az 2 simvol olmalıdır.' })
  displayName: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'Şifrə mətn tipli olmalıdır.' })
  @MinLength(8, { message: 'Şifrə ən az 8 simvol olmalıdır.' })
  password: string;

  @IsString({ message: 'Ad mətn tipli olmalıdır.' })
  @MinLength(2, { message: 'Ad ən az 2 simvol olmalıdır.' })
  displayName: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'OTP kodu mətn tipli olmalıdır.' })
  @MinLength(4, { message: 'OTP kodu keçərsizdir.' })
  otpCode: string;
}

export class ResendOtpDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;
}

export class VerifyResetCodeDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'Reset kodu mətn tipli olmalıdır.' })
  @MinLength(4, { message: 'Reset kodu keçərsizdir.' })
  resetCode: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Düzgün e-mail daxil edin.' })
  email: string;

  @IsString({ message: 'Reset kodu mətn tipli olmalıdır.' })
  @MinLength(4, { message: 'Reset kodu keçərsizdir.' })
  resetCode: string;

  @IsString({ message: 'Yeni şifrə mətn tipli olmalıdır.' })
  @MinLength(8, { message: 'Şifrə ən az 8 simvol olmalıdır.' })
  newPassword: string;
}

export class GoogleLoginDto {
  @IsString({ message: 'Google ID token mətn tipli olmalıdır.' })
  idToken: string;
}

export class ResetAdminPasswordDto {
  @IsString({ message: 'Şifrə mətn tipli olmalıdır.' })
  @MinLength(8, { message: 'Şifrə ən az 8 simvol olmalıdır.' })
  password: string;
}

