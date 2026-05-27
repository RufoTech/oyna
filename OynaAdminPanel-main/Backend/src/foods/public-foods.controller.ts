import { Controller, Get, Param } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';

/**
 * Public endpoints for the Flutter mobile app to fetch foods.
 * No JWT guard — any user can browse foods of a venue (via adminId).
 */
@Controller('public/foods')
export class PublicFoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get(':adminId')
  findAllByAdmin(@Param('adminId', ParseObjectIdPipe) adminId: string) {
    // Reusing the existing findAll method since it's just querying by adminId
    return this.foodsService.findAll(adminId);
  }
}
