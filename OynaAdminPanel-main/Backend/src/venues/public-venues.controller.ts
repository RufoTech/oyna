import { Controller, Get, Param, Query } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';

/**
 * Public endpoints for the Flutter mobile app.
 * No JWT guard — any authenticated Firebase user can browse venues.
 */
@Controller('public/venues')
export class PublicVenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('filterBy') filterBy?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    // If page & limit are provided, return paginated response
    if (page && limit) {
      return this.venuesService.findAllPublicPaginated(
        parseInt(page, 10) || 1,
        parseInt(limit, 10) || 10,
        search,
        sortBy,
        filterBy,
        lat ? parseFloat(lat) : undefined,
        lng ? parseFloat(lng) : undefined,
      );
    }
    // Otherwise return plain array (backwards compatible for map/favorites)
    return this.venuesService.findAllPublic(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.venuesService.findOnePublic(id);
  }

  /** GET /public/venues/:id/layout — Public layout for Flutter floor plan */
  @Get(':id/layout')
  getPublicLayout(@Param('id', ParseObjectIdPipe) id: string) {
    return this.venuesService.getPublicLayout(id);
  }

  /** GET /public/venues/:id/available-tables — Available table counts by tier */
  @Get(':id/available-tables')
  getAvailableTableCounts(@Param('id', ParseObjectIdPipe) id: string) {
    return this.venuesService.getAvailableTableCounts(id);
  }
}
