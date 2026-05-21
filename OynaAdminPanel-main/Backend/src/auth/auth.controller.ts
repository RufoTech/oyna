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
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface LoginDto {
  email: string;
  password: string;
}

interface CreateAdminDto {
  email: string;
  password: string;
  displayName: string;
}

interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

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

  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(@Body() { email, otpCode }: { email: string; otpCode: string }) {
    return this.authService.verifyOtp(email, otpCode);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  async resendOtp(@Body() { email }: { email: string }) {
    return this.authService.resendOtp(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/user')
  async userLogin(@Body() { email, password }: LoginDto) {
    return this.authService.loginUser(email, password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() { email }: { email: string }) {
    return this.authService.forgotPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-reset-code')
  async verifyResetCode(@Body() { email, resetCode }: { email: string; resetCode: string }) {
    return this.authService.verifyResetCode(email, resetCode);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() { email, resetCode, newPassword }: { email: string; resetCode: string; newPassword: string },
  ) {
    return this.authService.resetPasswordWithCode(email, resetCode, newPassword);
  }

  // ══════════════════════════════════════════════════════════════
  //  ADMIN AUTH ENDPOINTS (existing)
  // ══════════════════════════════════════════════════════════════

  @HttpCode(HttpStatus.OK)
  @Post('login/admin')
  async adminLogin(@Body() { email, password }: LoginDto) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Yanlis email ve ya sifre.');
    this.authService.ensureRole(user, 'ADMIN');
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/super-admin')
  async superAdminLogin(@Body() { email, password }: LoginDto) {
    const user = await this.authService.validateUser(email, password);
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
  async deleteAdmin(@Param('id') id: string, @Req() req: AuthRequest) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu əməliyyat yalnız super admin üçündür.');
    }
    return this.authService.deleteAdmin(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admins/:id/password')
  async resetAdminPassword(
    @Param('id') id: string,
    @Body('password') pass: string,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bu əməliyyat yalnız super admin üçündür.');
    }
    return this.authService.resetPassword(id, pass);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(
    @Body()
    dto: {
      email: string;
      displayName: string;
      photoURL?: string;
      uid: string;
    },
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
  async addFavorite(@Param('venueId') venueId: string, @Req() req: AuthRequest) {
    return this.authService.addFavorite(req.user.sub, venueId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:venueId')
  async removeFavorite(@Param('venueId') venueId: string, @Req() req: AuthRequest) {
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
