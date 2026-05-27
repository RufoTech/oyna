import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FoodsService } from './foods.service';
import { Food } from './schemas/food.schema';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';

interface AuthRequest extends Request {
  user: { sub: string; email: string; displayName?: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post()
  create(@Body() dto: Partial<Food>, @Req() req: AuthRequest) {
    return this.foodsService.create({
      ...dto,
      adminId: new Types.ObjectId(req.user.sub),
    });
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.foodsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string, @Req() req: AuthRequest) {
    return this.foodsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: Partial<Food>,
    @Req() req: AuthRequest,
  ) {
    return this.foodsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string, @Req() req: AuthRequest) {
    return this.foodsService.remove(id, req.user.sub);
  }
}
