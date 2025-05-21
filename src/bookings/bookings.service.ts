import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingFilterInput } from './dto/booking-filter.input';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { ChildBookingDetailDto } from './dto/child-booking-detail.dto';
import { UserRole, Prisma } from '@prisma/client'; // Prisma might be needed for types
import { format } from 'date-fns'; // For date and time formatting

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async getVendorBookings(
    vendorId: string,
    filters: BookingFilterInput,
  ): Promise<BookingDetailsDto[]> {
    // First, ensure the user is a vendor
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
    });
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found or user is not a vendor.');
    }

    const whereClause: Prisma.ClassPackageEnrollmentWhereInput = {
      classPackage: {
        vendorId: vendorId,
      },
    };

    if (filters.classPackageId) {
      whereClause.classPackageId = filters.classPackageId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.scheduleSlot = {
        startTime: {},
      };
      if (filters.startDate) {
        // Ensure startTime on or after the beginning of startDate
        whereClause.scheduleSlot.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Ensure startTime on or before the end of endDate
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        whereClause.scheduleSlot.startTime.lte = endDate;
      }
    }

    const enrollments = await this.prisma.classPackageEnrollment.findMany({
      where: whereClause,
      include: {
        user: true, // Parent
        classPackage: true,
        scheduleSlot: true,
        enrolledChildren: true,
      },
      orderBy: {
        scheduleSlot: {
          startTime: 'asc', // Or 'desc' for upcoming first
        },
      },
    });

    return enrollments.map((enrollment) => {
      const parent = enrollment.user;
      const classPackage = enrollment.classPackage;
      const scheduleSlot = enrollment.scheduleSlot;

      const childrenDetails: ChildBookingDetailDto[] =
        enrollment.enrolledChildren.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
        }));

      return {
        bookingId: enrollment.id,
        parentName: `${parent.firstName} ${parent.lastName}`,
        parentEmail: parent.email,
        parentPhoneNumber: parent.phoneNumber,
        classPackageId: classPackage.id,
        classPackageName: classPackage.name,
        children: childrenDetails,
        bookedDate: format(new Date(scheduleSlot.startTime), 'yyyy-MM-dd'),
        bookedTimeSlot: `${format(new Date(scheduleSlot.startTime), 'p')} - ${format(new Date(scheduleSlot.endTime), 'p')}`, // e.g., 10:00 AM - 12:00 PM
        bookingStatus: enrollment.bookingStatus,
        paymentType: enrollment.paymentType,
        numberOfChildrenBooked: enrollment.enrolledChildren.length,
      };
    });
  }

  // Helper to prevent overbooking - to be called during the booking creation process (not directly used by dashboard view)
  async canBookSlot(scheduleSlotId: string, numberOfChildrenToBook: number): Promise<boolean> {
    const slot = await this.prisma.scheduleSlot.findUnique({
        where: { id: scheduleSlotId },
        include: {
            _count: {
                select: { enrollments: true } // Counts total enrollment records for this slot
            },
            enrollments: { // Fetches all enrollments to sum up children
                select: { enrolledChildren: { select: { _count: true } } }
            }
        }
    });

    if (!slot) {
        throw new NotFoundException('Schedule slot not found.');
    }

    let currentlyBookedChildren = 0;
    slot.enrollments.forEach(enrollment => {
        currentlyBookedChildren += enrollment.enrolledChildren._count;
    });

    const availableSpots = slot.availableSlots - currentlyBookedChildren;
    return availableSpots >= numberOfChildrenToBook;
  }
} 