import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma, BookingStatus, User } from '@prisma/client';
import { AdminUserViewDto } from './dto/admin-user-view.dto';
import { AdminUserDetailsDto } from './dto/admin-user-details.dto';
import { AdminUpdateUserStatusInput } from './dto/admin-update-user-status.input';
import { AdminClassPackageBasicInfoDto } from './dto/admin-class-package-basic-info.dto';
import { AdminPackageEnrollmentBasicInfoDto } from './dto/admin-package-enrollment-basic-info.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';
import { VendorRevenueMetricsDto } from './dto/vendor-revenue-metrics.dto';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async listAllUsers(showDeleted: boolean = false): Promise<AdminUserViewDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: showDeleted ? { not: null } : null,
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
      where: { id: userId, deletedAt: null },
      include: {
        parent: {
          include: {
            enrollments: {
              orderBy: { bookedAt: 'desc' },
              include: {
                classPackage: {
                  include: {
                    vendor: {
                      include: {
                        profiles: true,
                      },
                    },
                  },
                },
              },
            },
            children: true,
          },
        },
        vendor: {
          include: {
            profiles: true,
            classPackages: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found or has been soft-deleted.`);
    }

    let enrolledPackages: AdminPackageEnrollmentBasicInfoDto[] | undefined;
    if (user.role === UserRole.PARENT && user.parent?.enrollments) {
      enrolledPackages = user.parent.enrollments.map(e => ({
        enrollmentId: e.id,
        classPackageId: e.classPackageId,
        classPackageName: e.classPackage.title,
        vendorId: e.classPackage.vendorId,
        vendorName: e.classPackage.vendor.profiles[0]?.businessName || '',
        bookingStatus: e.bookingStatus,
        bookedAt: e.bookedAt,
      }));
    }

    let createdPackagesByVendor: AdminClassPackageBasicInfoDto[] | undefined;
    if (user.role === UserRole.VENDOR && user.vendor) {
      createdPackagesByVendor = user.vendor.classPackages.map(cp => ({
        id: cp.id,
        title: cp.title,
        price: cp.price,
        status: cp.status,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
      }));
    }

    let mappedChildren: any[] | undefined;
    if (user.role === UserRole.PARENT && user.parent?.children) {
      mappedChildren = user.parent.children.map(child => ({
        ...child,
        parentId: child.parentId,
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
      children: mappedChildren,
      enrolledPackages,
      vendorProfile: user.role === UserRole.VENDOR ? user.vendor?.profiles[0] : undefined,
      createdPackages: createdPackagesByVendor,
    } as AdminUserDetailsDto;
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
      if (input.setDeleted) dataToUpdate.isActive = false;
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

  async getVendorRevenueStats(vendorId: string, filters?: DateRangeFilterDto): Promise<VendorRevenueMetricsDto> {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: { vendor: true },
    });
    if (!vendor || vendor.role !== UserRole.VENDOR || !vendor.vendor) {
      throw new NotFoundException('Vendor not found or user is not a vendor.');
    }

    // Calculate total pending payout
    const pendingPayout = await this.prisma.payment.aggregate({
      where: {
        classPackageEnrollment: {
          classPackage: {
            vendorId: vendor.vendor.id,
          },
        },
        isPaidOutToVendor: false,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total payments in date range
    const dateRange = filters ? {
      gte: filters.startDate,
      lte: filters.endDate,
    } : undefined;

    const paymentsInRange = await this.prisma.payment.aggregate({
      where: {
        classPackageEnrollment: {
          classPackage: {
            vendorId: vendor.vendor.id,
          },
        },
        status: 'COMPLETED',
        createdAt: dateRange,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      pendingPayoutToDate: pendingPayout._sum.amount || 0,
      totalPaymentsInRange: paymentsInRange._sum.amount || 0,
    };
  }
} 