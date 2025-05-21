import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { BookingFilterInput } from './dto/booking-filter.input';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming you have a JWT guard

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT and Role checks
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('vendor')
  @Roles(UserRole.VENDOR) // Only vendors can access this
  @ApiOperation({ summary: 'Get bookings for the logged-in vendor' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved bookings.', type: [BookingDetailsDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getVendorBookings(
    @Req() req, // To get the logged-in user's ID
    @Query() filters: BookingFilterInput,
  ): Promise<BookingDetailsDto[]> {
    const vendorId = req.user.id; // Assuming user ID is stored in req.user by JwtAuthGuard
    return this.bookingsService.getVendorBookings(vendorId, filters);
  }
} 