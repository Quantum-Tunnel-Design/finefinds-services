import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { BookingFilterInput } from './dto/booking-filter.input';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { ParentBookingDetailsDto } from './dto/parent-booking-details.dto';
import { ParentBookingType } from './dto/parent-booking-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User as PrismaUser } from '@prisma/client';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsResolver {
  constructor(private readonly bookingsService: BookingsService) {}

  @Query(() => [BookingDetailsDto], {
    name: 'myVendorBookings',
    description: 'Retrieves all bookings associated with the currently authenticated vendor. Supports filtering by class package ID and date range.',
  })
  @Roles(UserRole.VENDOR)
  async getMyVendorBookings(
    @CurrentUser() user: PrismaUser,
    @Args('filters', {
      type: () => BookingFilterInput,
      nullable: true,
      description: 'Optional filters for class package ID, start date, and end date.',
    })
    filters?: BookingFilterInput,
  ): Promise<BookingDetailsDto[]> {
    return this.bookingsService.getVendorBookings(user.id, filters);
  }

  @Query(() => [ParentBookingDetailsDto], {
    name: 'myParentBookings',
    description: 'Retrieves all bookings for the currently authenticated parent. Can be filtered by type (upcoming or past bookings).'
  })
  @Roles(UserRole.PARENT)
  async getMyParentBookings(
    @CurrentUser() user: PrismaUser,
    @Args('type', {
      type: () => ParentBookingType,
      description: "Specifies whether to fetch 'upcoming' or 'past' bookings.",
    })
    type: ParentBookingType,
  ): Promise<ParentBookingDetailsDto[]> {
    return this.bookingsService.getParentBookings(user.id, type);
  }
} 