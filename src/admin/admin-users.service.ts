import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma, BookingStatus, User } from '@prisma/client';
import { AdminUserViewDto } from './dto/admin-user-view.dto';
import { AdminUserDetailsDto } from './dto/admin-user-details.dto';
import { AdminUpdateUserStatusInput } from './dto/admin-update-user-status.input';
import { AdminClassPackageBasicInfoDto } from './dto/admin-class-package-basic-info.dto';
import { AdminPackageEnrollmentBasicInfoDto } from './dto/admin-package-enrollment-basic-info.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto'; // Assuming this exists or similar for revenue
import { VendorRevenueMetricsDto } from '../vendors/dto/vendor-revenue-metrics.dto'; // For revenue stats type

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async listAllUsers(showDeleted: boolean = false): Promise<AdminUserViewDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: showDeleted ? { not: null } : null, // Filter by soft delete status
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getUserDetailsById(userId: string): Promise<AdminUserDetailsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }, // Typically don't fetch details for deleted users unless specified
      include: {
        children: { orderBy: { createdAt: 'asc' } },
        businessProfile: true,
        vendorProfile: true,
        createdClassPackages: {
          orderBy: { createdAt: 'desc' },
          include: { category: true, ageGroups: true }, // Include necessary fields for AdminClassPackageBasicInfoDto
        },
        enrollments: {
          orderBy: { bookedAt: 'desc' },
          include: {
            classPackage: {
              include: {
                vendor: { include: { businessProfile: true } }, // To get vendor name
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found or has been soft-deleted.`);
    }

    let enrolledPackages: AdminPackageEnrollmentBasicInfoDto[] | undefined;
    if (user.role === UserRole.PARENT && user.enrollments) {
      enrolledPackages = user.enrollments.map(e => ({
        enrollmentId: e.id,
        classPackageId: e.classPackageId,
        classPackageName: e.classPackage.name,
        vendorId: e.classPackage.vendorId,
        vendorName: e.classPackage.vendor.businessProfile?.businessName || `${e.classPackage.vendor.firstName} ${e.classPackage.vendor.lastName}`,
        bookingStatus: e.bookingStatus,
        bookedAt: e.bookedAt,
      }));
    }

    let createdPackagesByVendor: AdminClassPackageBasicInfoDto[] | undefined;
    if (user.role === UserRole.VENDOR && user.createdClassPackages) {
      createdPackagesByVendor = user.createdClassPackages.map(p => ({
        id: p.id,
        name: p.name,
        pricePerChild: p.pricePerChild,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    }

    let mappedChildren: any[] | undefined;
    if (user.role === UserRole.PARENT && user.children) {
      mappedChildren = user.children.map(child => ({
        ...child,
        parentId: child.userId, // Map userId to parentId
      }));
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      children: mappedChildren, // Use mapped children
      enrolledPackages,
      businessProfile: user.role === UserRole.VENDOR ? user.businessProfile : undefined,
      vendorProfile: user.role === UserRole.VENDOR ? user.vendorProfile : undefined,
      createdPackages: createdPackagesByVendor,
    } as AdminUserDetailsDto; // Cast to ensure type compatibility if Prisma types don't perfectly match GraphQL models
  }

  async updateUserStatus(userId: string, input: AdminUpdateUserStatusInput): Promise<AdminUserViewDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};
    if (input.isActive !== undefined) {
      dataToUpdate.isActive = input.isActive;
    }
    if (input.setDeleted !== undefined) {
      dataToUpdate.deletedAt = input.setDeleted ? new Date() : null;
      if (input.setDeleted) dataToUpdate.isActive = false; // Typically, soft-deleted users are also inactive
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('No update parameters provided.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        deletedAt: updatedUser.deletedAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
  }

  // Placeholder for vendor revenue stats - adapt from VendorsService if needed
  async getVendorRevenueStats(vendorId: string, filters?: DateRangeFilterDto): Promise<VendorRevenueMetricsDto> {
    // This logic would be similar to what was in VendorsService.getVendorDashboardData
    // For brevity, this is a placeholder. It would query Payments related to the vendor.
    const vendor = await this.prisma.user.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found or user is not a vendor.');
    }
    // Example: reuse or reimplement VendorsService.getVendorDashboardData logic here for metrics
    // const dashboardData = await this.vendorsService.getVendorDashboardData(vendorId, filters); // If injecting VendorsService
    // return dashboardData.metrics;
    return {
      pendingPayoutToDate: 0, // Replace with actual calculation
      totalPaymentsInRange: 0, // Replace with actual calculation
    };
  }
} 