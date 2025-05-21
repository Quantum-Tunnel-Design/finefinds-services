import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For RolesGuard and potentially JwtAuthGuard

@Module({
  imports: [PrismaModule, AuthModule], // Import AuthModule if RolesGuard or JwtAuthGuard are defined there
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {} 