import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { BrevoService } from './brevo.service';
import { ConfigService } from '@nestjs/config';

type UserWithoutPassword = Omit<User, 'passwordHash'> & { _id: string };

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private refreshSecret!: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private brevoService: BrevoService,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    // Validate required secrets at startup
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET environment variable is not set. ' +
        'Please add it to your .env file. The application cannot start without it.',
      );
    }
    this.refreshSecret = refreshSecret;

    const superAdmin = await this.userModel
      .findOne({ role: 'SUPER_ADMIN' })
      .exec();

    if (!superAdmin) {
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@oyna.com';
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await this.userModel.create({
        email: adminEmail,
        passwordHash,
        displayName: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });
      this.logger.log('Default super admin created');
    }
  }

  // ── Helper: Enforce strong password complexity ──
  private validatePasswordStrength(password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException('Şifrə ən azı 8 simvoldan ibarət olmalıdır.');
    }
    if (/\s/.test(password)) {
      throw new BadRequestException('Şifrədə boşluq (whitespace) simvollarından istifadə edilə bilməz.');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || (!/[0-9]/.test(password) && !/[!@#$%^&*(),.?":{}|<>]/.test(password))) {
      throw new BadRequestException(
        'Şifrədə ən azı bir böyük hərf, bir kiçik hərf və bir rəqəm və ya xüsusi simvol olmalıdır.',
      );
    }
  }

  // ── Helper: Generate 6-digit OTP ──
  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  // ══════════════════════════════════════════════════════════════
  //  USER REGISTRATION (with OTP verification)
  // ══════════════════════════════════════════════════════════════

  async registerUser(dto: {
    email: string;
    password: string;
    displayName: string;
  }) {
    const email = dto.email.trim().toLowerCase();
    this.validatePasswordStrength(dto.password);

    // Check if user already exists
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Bu email ilə hesab artıq mövcuddur.');
    }

    // If user exists but PENDING, resend OTP
    if (existing && existing.status === 'PENDING') {
      const otpCode = this.generateOtp();
      existing.otpCode = otpCode;
      existing.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      existing.passwordHash = await bcrypt.hash(dto.password, 10);
      existing.displayName = dto.displayName.trim();
      await existing.save();

      await this.brevoService.sendOtpEmail(email, otpCode);

      return {
        message: 'Doğrulama kodu e-poçtunuza göndərildi.',
        email,
        requiresVerification: true,
      };
    }

    // Create new PENDING user
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generateOtp();

    await this.userModel.create({
      email,
      passwordHash,
      displayName: dto.displayName.trim(),
      role: 'USER',
      status: 'PENDING',
      otpCode,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await this.brevoService.sendOtpEmail(email, otpCode);

    return {
      message: 'Doğrulama kodu e-poçtunuza göndərildi.',
      email,
      requiresVerification: true,
    };
  }

  // ══════════════════════════════════════════════════════════════
  //  OTP VERIFY
  // ══════════════════════════════════════════════════════════════

  async verifyOtp(email: string, otpCode: string) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user) {
      throw new BadRequestException('İstifadəçi tapılmadı.');
    }

    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Hesab artıq doğrulanıb.');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('Doğrulama kodu tapılmadı. Yeni kod tələb edin.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Doğrulama kodunun vaxtı keçib. Yeni kod tələb edin.');
    }

    if (user.otpCode !== otpCode) {
      throw new BadRequestException('Yanlış doğrulama kodu.');
    }

    // Activate user
    user.status = 'ACTIVE';
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Return JWT token
    return this.login({
      _id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'ADMIN' | 'SUPER_ADMIN' | 'USER',
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  RESEND OTP
  // ══════════════════════════════════════════════════════════════

  async resendOtp(email: string) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user) {
      throw new BadRequestException('İstifadəçi tapılmadı.');
    }

    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Hesab artıq doğrulanıb.');
    }

    const otpCode = this.generateOtp();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await this.brevoService.sendOtpEmail(user.email, otpCode);

    return { message: 'Yeni doğrulama kodu göndərildi.', email: user.email };
  }

  // ══════════════════════════════════════════════════════════════
  //  USER LOGIN
  // ══════════════════════════════════════════════════════════════

  async loginUser(email: string, password: string) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Yanlış email və ya şifrə.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Yanlış email və ya şifrə.');
    }

    // If user is still PENDING, resend OTP
    if (user.status === 'PENDING') {
      const otpCode = this.generateOtp();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      await this.brevoService.sendOtpEmail(user.email, otpCode);

      return {
        message: 'Hesabınız hələ doğrulanmayıb. Yeni kod göndərildi.',
        email: user.email,
        requiresVerification: true,
      };
    }

    return this.login({
      _id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'ADMIN' | 'SUPER_ADMIN' | 'USER',
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  FORGOT PASSWORD
  // ══════════════════════════════════════════════════════════════

  async forgotPassword(email: string) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user) {
      // Prevent user enumeration by returning a generic success response
      return { message: 'Sıfırlama kodu e-poçtunuza göndərildi.' };
    }

    const resetCode = this.generateOtp();
    user.resetCode = resetCode;
    user.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await this.brevoService.sendResetPasswordEmail(user.email, resetCode);

    return { message: 'Sıfırlama kodu e-poçtunuza göndərildi.' };
  }

  // ══════════════════════════════════════════════════════════════
  //  VERIFY RESET CODE
  // ══════════════════════════════════════════════════════════════

  async verifyResetCode(email: string, resetCode: string) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user) {
      throw new BadRequestException('İstifadəçi tapılmadı.');
    }

    if (!user.resetCode || !user.resetCodeExpiresAt) {
      throw new BadRequestException('Sıfırlama kodu tapılmadı. Yeni kod tələb edin.');
    }

    if (new Date() > user.resetCodeExpiresAt) {
      throw new BadRequestException('Sıfırlama kodunun vaxtı keçib. Yeni kod tələb edin.');
    }

    if (user.resetCode !== resetCode) {
      throw new BadRequestException('Yanlış sıfırlama kodu.');
    }

    return { message: 'Kod təsdiqləndi', success: true };
  }

  // ══════════════════════════════════════════════════════════════
  //  RESET PASSWORD WITH CODE
  // ══════════════════════════════════════════════════════════════

  async resetPasswordWithCode(
    email: string,
    resetCode: string,
    newPassword: string,
  ) {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();

    if (!user) {
      throw new BadRequestException('İstifadəçi tapılmadı.');
    }

    if (!user.resetCode || !user.resetCodeExpiresAt) {
      throw new BadRequestException('Sıfırlama kodu tapılmadı. Yeni kod tələb edin.');
    }

    if (new Date() > user.resetCodeExpiresAt) {
      throw new BadRequestException('Sıfırlama kodunun vaxtı keçib. Yeni kod tələb edin.');
    }

    if (user.resetCode !== resetCode) {
      throw new BadRequestException('Yanlış sıfırlama kodu.');
    }

    // Update password
    this.validatePasswordStrength(newPassword);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();

    return { message: 'Şifrəniz uğurla yeniləndi. İndi daxil ola bilərsiniz.' };
  }

  // ══════════════════════════════════════════════════════════════
  //  EXISTING METHODS (unchanged)
  // ══════════════════════════════════════════════════════════════

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user.toObject();
      return { ...result, _id: result._id.toString() } as UserWithoutPassword;
    }
    return null;
  }

  ensureRole(user: UserWithoutPassword, role: 'ADMIN' | 'SUPER_ADMIN') {
    if (role === 'ADMIN' && user.role === 'SUPER_ADMIN') {
      return; // Super admins can access admin endpoints/logins
    }
    if (user.role !== role) {
      throw new ForbiddenException('Bu giriş tipi üçün icazəniz yoxdur.');
    }
  }

  async createAdmin(dto: {
    email: string;
    password: string;
    displayName: string;
  }) {
    const existingUser = await this.userModel
      .findOne({ email: dto.email.trim().toLowerCase() })
      .exec();
    if (existingUser) {
      throw new ForbiddenException('Bu email ilə istifadəçi artıq mövcuddur.');
    }

    this.validatePasswordStrength(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const createdUser = await this.userModel.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      displayName: dto.displayName.trim(),
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const { passwordHash: _passwordHash, ...result } = createdUser.toObject();
    return { ...result, _id: result._id.toString() };
  }

  async listAdmins() {
    const admins = await this.userModel
      .find({ role: 'ADMIN' })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();

    return admins.map((admin) => ({
      ...admin.toObject(),
      _id: admin._id.toString(),
    }));
  }

  async login(user: {
    _id: string;
    email: string;
    displayName?: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  }) {
    const payload = {
      email: user.email,
      sub: user._id,
      displayName: user.displayName,
      role: user.role,
    };

    const refreshPayload = { sub: user._id };
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: this.refreshSecret,
      expiresIn: '30d',
    });

    const refreshTokenHash = await bcrypt.hash(refresh_token, 10);
    await this.userModel.findByIdAndUpdate(user._id, { refreshTokenHash }).exec();

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token,
      user: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        _id: user._id,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });

      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.refreshTokenHash || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Giriş icazəsi yoxdur və ya istifadəçi aktiv deyil.');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Giriş icazəsi yoxdur.');
      }

      return this.login({
        _id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role as 'ADMIN' | 'SUPER_ADMIN' | 'USER',
      });
    } catch (err) {
      throw new UnauthorizedException('Token etibarsız və ya vaxtı bitib.');
    }
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } }).exec();
    return { success: true };
  }

  async deleteAdmin(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('Öz hesabınızı silə bilməzsiniz.');
    }

    const result = await this.userModel
      .findOneAndDelete({ _id: id, role: 'ADMIN' })
      .exec();
    if (!result) {
      throw new ForbiddenException(
        'Admin tapılmadı və ya silinməsinə icazə verilmir.',
      );
    }
    return { success: true };
  }

  async resetPassword(id: string, pass: string) {
    this.validatePasswordStrength(pass);
    const passwordHash = await bcrypt.hash(pass, 10);
    const result = await this.userModel
      .findOneAndUpdate(
        { _id: id, role: 'ADMIN' },
        { $set: { passwordHash } },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new ForbiddenException(
        'Admin tapılmadı və ya şifrəsi sıfırlana bilməz.',
      );
    }
    return { success: true };
  }

  async syncGoogleUser(dto: { idToken: string }) {
    let email: string;
    let displayName: string;
    let photoURL: string | undefined;
    let uid: string;

    if (admin.apps.length > 0) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(dto.idToken);
        email = decodedToken.email || '';
        displayName = decodedToken.name || '';
        photoURL = decodedToken.picture;
        uid = decodedToken.uid;
      } catch (err) {
        throw new UnauthorizedException('Google ID tokeni etibarsızdır: ' + err.message);
      }
    } else {
      // Dev mode fallback ONLY if NOT production
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Firebase Admin SDK başlatılmayıb, Google login mümkün deyil.');
      }
      this.logger.warn(
        '⚠️ Firebase Admin SDK is NOT initialized. Faking Google token verification (only allowed in development).',
      );

      try {
        const parts = dto.idToken ? dto.idToken.split('.') : [];
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          email = payload.email || '';
          displayName = payload.name || '';
          photoURL = payload.picture;
          uid = payload.sub || payload.uid || '';
        } else if (dto.idToken && dto.idToken.includes('@')) {
          email = dto.idToken;
          displayName = dto.idToken.split('@')[0];
          uid = 'dev-uid-' + displayName;
        } else {
          throw new Error('Invalid token');
        }
      } catch (err) {
        throw new UnauthorizedException('Firebase doğrulama açarları çatışmır.');
      }
    }

    let user = await this.userModel.findOne({ email }).exec();

    if (user) {
      // Update existing user details
      user.displayName = displayName;
      user.photoURL = photoURL;
      user.uid = uid;
      user.status = 'ACTIVE';
      await user.save();
    } else {
      // Create new user
      user = await this.userModel.create({
        email,
        displayName,
        photoURL,
        uid,
        role: 'USER',
        status: 'ACTIVE',
      });
    }

    return this.login({
      _id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'ADMIN' | 'SUPER_ADMIN' | 'USER',
    });
  }

  async getFavorites(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new ForbiddenException('User not found');
    return user.favorites ? user.favorites.map(id => id.toString()) : [];
  }

  async addFavorite(userId: string, venueId: string): Promise<string[]> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: venueId } },
      { new: true }
    ).exec();

    if (!user) throw new ForbiddenException('User not found');
    return user.favorites ? user.favorites.map(id => id.toString()) : [];
  }

  async removeFavorite(userId: string, venueId: string): Promise<string[]> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: venueId } },
      { new: true }
    ).exec();

    if (!user) throw new ForbiddenException('User not found');
    return user.favorites ? user.favorites.map(id => id.toString()) : [];
  }

  async updateProfile(userId: string, updateData: { displayName?: string }) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new ForbiddenException('İstifadəçi tapılmadı.');

    if (updateData.displayName !== undefined) {
      user.displayName = updateData.displayName;
    }

    await user.save();

    return this.login({
      _id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'ADMIN' | 'SUPER_ADMIN' | 'USER',
    });
  }
}
