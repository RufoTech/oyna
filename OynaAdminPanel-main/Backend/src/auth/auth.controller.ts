import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import {
  LoginDto,
  CreateAdminDto,
  RegisterDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  GoogleLoginDto,
  ResetAdminPasswordDto,
} from './dto/auth.dto';

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    displayName?: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // ══════════════════════════════════════════════════════════════
  //  MOBILE USER AUTH ENDPOINTS
  // ══════════════════════════════════════════════════════════════

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otpCode);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/user')
  async userLogin(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto.email, dto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-reset-code')
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto.email, dto.resetCode);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPasswordWithCode(dto.email, dto.resetCode, dto.newPassword);
  }

  // ══════════════════════════════════════════════════════════════
  //  ADMIN AUTH ENDPOINTS (existing)
  // ══════════════════════════════════════════════════════════════

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/admin')
  async adminLogin(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Yanlis email ve ya sifre.');
    this.authService.ensureRole(user, 'ADMIN');
    return this.authService.login(user);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/super-admin')
  async superAdminLogin(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Yanlis email ve ya sifre.');
    this.authService.ensureRole(user, 'SUPER_ADMIN');
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admins')
  async listAdmins(@Req() req: AuthRequest) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu emeliyyat yalniz super admin ucundur.');
    }
    return this.authService.listAdmins();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admins')
  async createAdmin(@Body() dto: CreateAdminDto, @Req() req: AuthRequest) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu əməliyyat yalnız super admin üçündür.');
    }
    return this.authService.createAdmin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admins/:id')
  async deleteAdmin(@Param('id', ParseObjectIdPipe) id: string, @Req() req: AuthRequest) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu əməliyyat yalnız super admin üçündür.');
    }
    return this.authService.deleteAdmin(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admins/:id/password')
  async resetAdminPassword(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ResetAdminPasswordDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu əməliyyat yalnız super admin üçündür.');
    }
    return this.authService.resetPassword(id, dto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(
    @Body()
    dto: GoogleLoginDto,
  ) {
    return this.authService.syncGoogleUser(dto);
  }

  // ══════════════════════════════════════════════════════════════
  //  FAVORITES (existing)
  // ══════════════════════════════════════════════════════════════

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getFavorites(@Req() req: AuthRequest) {
    return this.authService.getFavorites(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('favorites/:venueId')
  async addFavorite(@Param('venueId', ParseObjectIdPipe) venueId: string, @Req() req: AuthRequest) {
    return this.authService.addFavorite(req.user.sub, venueId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:venueId')
  async removeFavorite(@Param('venueId', ParseObjectIdPipe) venueId: string, @Req() req: AuthRequest) {
    return this.authService.removeFavorite(req.user.sub, venueId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() body: { displayName?: string },
  ) {
    return this.authService.updateProfile(req.user.sub, body);
  }
}
