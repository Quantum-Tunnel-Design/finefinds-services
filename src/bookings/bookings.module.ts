import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
// import { BookingsController } from './bookings.controller'; // Controller is now empty
import { BookingsResolver } from './bookings.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For RolesGuard and potentially JwtAuthGuard
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { registerEnumType } from '@nestjs/graphql';
import { BookingStatus, PaymentType } from '@prisma/client';
import { ParentBookingType } from './dto/parent-booking-type.enum';

// Centralized enum registration
registerEnumType(BookingStatus, { name: 'BookingStatus' });
registerEnumType(PaymentType, { name: 'PaymentType' });
registerEnumType(ParentBookingType, { name: 'ParentBookingType' });

@Module({
  imports: [
    PrismaModule,
    AuthModule, // Import AuthModule if RolesGuard or JwtAuthGuard are defined there
    UsersModule, // Add UsersModule to imports
  ],
  // controllers: [BookingsController], // Removed empty controller
  providers: [BookingsService, BookingsResolver],
  exports: [BookingsService],
})
export class BookingsModule {} 