import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingFilterInput } from './dto/booking-filter.input';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { ChildBookingDetailDto } from './dto/child-booking-detail.dto';
import { UserRole, Prisma } from '@prisma/client'; // Removed BookingStatus, PaymentType
import { format } from 'date-fns'; // For date and time formatting
import { ParentBookingDetailsDto } from './dto/parent-booking-details.dto'; // Added

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
      const startTimeFilter: Prisma.DateTimeFilter = {};
      if (filters.startDate) {
        startTimeFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        startTimeFilter.lte = endDate;
      }
      whereClause.scheduleSlot = {
        startTime: startTimeFilter,
      };
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
                select: { enrollments: true } // Total enrollment records for this slot
            },
            enrollments: { // Fetches all enrollments to sum up children for this slot
                select: {
                    _count: { select: { enrolledChildren: true } } // Count of children for each enrollment
                }
            }
        }
    });

    if (!slot) {
        throw new NotFoundException('Schedule slot not found.');
    }

    let currentlyBookedChildren = 0;
    slot.enrollments.forEach(enrollment => {
        currentlyBookedChildren += enrollment._count.enrolledChildren;
    });

    const availableSpots = slot.availableSlots - currentlyBookedChildren;
    return availableSpots >= numberOfChildrenToBook;
  }

  async getParentBookings(
    parentId: string,
    filterType: 'upcoming' | 'past',
  ): Promise<ParentBookingDetailsDto[]> {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException('Parent not found or user is not a parent.');
    }

    const now = new Date();
    const whereClause: Prisma.ClassPackageEnrollmentWhereInput = {
      userId: parentId,
      scheduleSlot: {
        startTime: filterType === 'upcoming' ? { gte: now } : { lt: now },
      },
    };

    const enrollments = await this.prisma.classPackageEnrollment.findMany({
      where: whereClause,
      include: {
        classPackage: {
          include: {
            vendor: {
              include: {
                vendorProfile: true, // To get vendor name and location
              },
            },
          },
        },
        scheduleSlot: true,
        enrolledChildren: true,
      },
      orderBy: {
        scheduleSlot: {
          startTime: filterType === 'upcoming' ? 'asc' : 'desc',
        },
      },
    });

    return enrollments.map((enrollment) => {
      const classPackage = enrollment.classPackage;
      const vendor = classPackage.vendor;
      const scheduleSlot = enrollment.scheduleSlot;

      const childrenDetails: ChildBookingDetailDto[] =
        enrollment.enrolledChildren.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
        }));
      
      let vendorName = `${vendor.firstName} ${vendor.lastName}`;
      if (vendor.vendorProfile && vendor.vendorProfile.businessName) {
        vendorName = vendor.vendorProfile.businessName;
      }

      return {
        bookingId: enrollment.id,
        classPackageName: classPackage.name,
        classPackageId: classPackage.id,
        vendorName: vendorName,
        vendorId: vendor.id,
        enrolledChildren: childrenDetails,
        bookedDate: format(new Date(scheduleSlot.startTime), 'yyyy-MM-dd'),
        bookedTimeSlot: `${format(new Date(scheduleSlot.startTime), 'p')} - ${format(new Date(scheduleSlot.endTime), 'p')}`,
        location: vendor.vendorProfile?.location || 'Location not available',
        bookingStatus: enrollment.bookingStatus,
        paymentType: enrollment.paymentType,
        scheduleSlotId: scheduleSlot.id,
      };
    });
  }
} 