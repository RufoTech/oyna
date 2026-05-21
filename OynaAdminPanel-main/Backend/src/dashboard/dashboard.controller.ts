import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { sub: string; email: string; displayName?: string };
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard-stats')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getStats(@Req() req: AuthRequest) {
    return this.dashboardService.getDashboardStats(req.user.sub);
  }
}
