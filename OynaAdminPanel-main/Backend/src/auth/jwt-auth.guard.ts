import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(
        'Token tapılmadı. Zəhmət olmasa daxil olun.',
      );
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Dynamic blacklisting & privilege validation:
      const dbUser = await this.userModel
        .findById(payload.sub)
        .select('status role')
        .lean()
        .exec();

      if (!dbUser || dbUser.status !== 'ACTIVE') {
        throw new UnauthorizedException('İstifadəçi hesabı aktiv deyil və ya silinib.');
      }

      // Add verified user details to request object, using fresh role from DB
      request['user'] = {
        ...payload,
        role: dbUser.role,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Token etibarsız və ya vaxtı bitib.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
