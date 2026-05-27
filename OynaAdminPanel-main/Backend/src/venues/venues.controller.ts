import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { VenuesService } from './venues.service';
import { Venue } from './schemas/venue.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReservationsGateway } from '../reservations/reservations.gateway';

interface AuthRequest extends Request {
  user: { sub: string; email: string; displayName?: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('venues')
export class VenuesController {
  constructor(
    private readonly venuesService: VenuesService,
    @Inject(forwardRef(() => ReservationsGateway))
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  @Post()
  create(@Body() dto: Partial<Venue>, @Req() req: AuthRequest) {
    return this.venuesService.create({
      ...dto,
      adminId: new Types.ObjectId(req.user.sub),
    });
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.venuesService.findAll(req.user.sub);
  }

  @Get('shared/branches')
  getBranches(@Req() req: AuthRequest) {
    return this.venuesService.findAllBranches(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.venuesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<Venue>,
    @Req() req: AuthRequest,
  ) {
    const updatedVenue = await this.venuesService.update(id, dto, req.user.sub);

    // Broadcast real-time venue status changes to all Flutter users
    if (
      dto.status !== undefined ||
      dto.temporarilyClosed !== undefined ||
      dto.operatingHours !== undefined
    ) {
      this.reservationsGateway.emitVenueUpdate(updatedVenue);
    }

    return updatedVenue;
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.venuesService.remove(id, req.user.sub);
  }

  // ═══════════════════════════════════════════════
  // BLOCKED USERS ENDPOINTS
  // ═══════════════════════════════════════════════

  @Get(':id/blocked-users')
  getBlockedUsers(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.venuesService.getBlockedUsers(id, req.user.sub);
  }

  @Patch(':id/block-user')
  blockUser(
    @Param('id') id: string,
    @Body() body: { email: string; action: 'block' | 'unblock' },
    @Req() req: AuthRequest,
  ) {
    return this.venuesService.blockUserForVenue(id, body.email, body.action, req.user.sub);
  }

  // ═══════════════════════════════════════════════
  // SPECS ENDPOINTS (Step 4 — Tiers & Packages)
  // ═══════════════════════════════════════════════

  @Get(':id/specs')
  getSpecs(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.venuesService.getSpecs(id, req.user.sub);
  }

  @Patch(':id/specs')
  updateSpecs(
    @Param('id') id: string,
    @Body() specsDto: any,
    @Req() req: AuthRequest,
  ) {
    return this.venuesService.updateSpecs(id, specsDto, req.user.sub);
  }

  // ═══════════════════════════════════════════════
  // LAYOUT ENDPOINTS (Floor-plan simulator)
  // ═══════════════════════════════════════════════

  @Get(':id/layout')
  getLayout(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.venuesService.getLayout(id, req.user.sub);
  }

  @Patch(':id/layout')
  async updateLayout(
    @Param('id') id: string,
    @Body() layoutDto: any,
    @Req() req: AuthRequest,
  ) {
    const updatedLayout = await this.venuesService.updateLayout(id, layoutDto, req.user.sub);
    
    // Broadcast real-time layout update to all Flutter users
    this.reservationsGateway.emitVenueLayoutUpdate(id, updatedLayout);

    return updatedLayout;
  }
}
