import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, PaymentStatus, Prisma } from '@prisma/client';
import { AdminDashboardDataDto } from './dto/admin-dashboard-data.dto';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { MonthlyPaymentDataDto } from './dto/monthly-payment-data.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';
import { AdminTransactionListViewDto } from './dto/admin-transaction-list-view.dto';
import { AdminUserListViewDto, PaginatedUserListResponse } from './dto/admin-user-list-view.dto';
import { AdminUserListFilterDto } from './dto/admin-user-list-filter.dto';
import { AgeGroup } from './dto/age-group.enum';
import { PaginationInfo } from './dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(filters?: DateRangeFilterDto): Promise<DashboardMetricsDto> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters?.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the whole end day
      dateFilter.lte = endDate;
    }

    // Get total online payments
    const onlinePaymentsAggregation = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    });

    // Get user counts from Parent and Vendor tables
    const [parentsCount, vendorsCount] = await Promise.all([
      // Count from Parent table
      this.prisma.parent.count({
        where: {
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
      }),
      // Count from Vendor table
      this.prisma.vendor.count({
        where: {
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
      }),
    ]);

    // Calculate total users (sum of parents and vendors)
    const totalUsers = parentsCount + vendorsCount;

    return {
      onlinePaymentsTotal: onlinePaymentsAggregation._sum.amount || 0,
      totalPayments: onlinePaymentsAggregation._count.id || 0,
      totalUsers,
      parentsRegistered: parentsCount,
      vendorsRegistered: vendorsCount,
    };
  }

  async getPaymentChartData(filters?: DateRangeFilterDto): Promise<AdminDashboardDataDto> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters?.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the whole end day
      dateFilter.lte = endDate;
    }

    // Get metrics
    const metrics = await this.getMetrics(filters);

    // Get monthly payment data for the chart
    const startDateString = filters?.startDate ? new Date(filters.startDate).toISOString() : new Date(0).toISOString();
    const endDateString = filters?.endDate
      ? new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)).toISOString()
      : new Date().toISOString();

    const monthlyPaymentsRaw: { year_month: string; total_amount: number }[] = await this.prisma.$queryRaw`
      SELECT
        to_char("createdAt", 'YYYY-MM') as year_month,
        SUM(amount) as total_amount
      FROM payments
      WHERE status = 'COMPLETED'
        AND "createdAt" >= ${new Date(startDateString)}::timestamp
        AND "createdAt" <= ${new Date(endDateString)}::timestamp
      GROUP BY year_month
      ORDER BY year_month ASC;
    `;

    const monthlyPayments: MonthlyPaymentDataDto[] = monthlyPaymentsRaw.map(item => ({
      month: item.year_month,
      totalAmount: Number(item.total_amount) || 0,
    }));

    return {
      metrics,
      monthlyPayments,
    };
  }

  async listAllTransactions(filters?: DateRangeFilterDto): Promise<AdminTransactionListViewDto[]> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters?.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        // Potentially add other filters, e.g., by status, user, etc.
      },
      include: {
        classPackageEnrollment: {
          include: {
            classPackage: {
              include: {
                vendor: {
                  include: {
                    profiles: true,
                    user: true,
                  },
                },
              },
            },
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => {
      const enrollment = payment.classPackageEnrollment;
      const classPackage = enrollment?.classPackage;
      const vendor = classPackage?.vendor;
      const vendorProfile = vendor?.profiles?.[0];
      const parent = enrollment?.parent;
      const parentName = parent && parent.user ? `${parent.user.firstName ?? ''} ${parent.user.lastName ?? ''}`.trim() : 'N/A';
      const vendorName = vendorProfile?.businessName || (vendor && vendor.user ? `${vendor.user.firstName ?? ''} ${vendor.user.lastName ?? ''}`.trim() : 'N/A');
      return {
        id: payment.id,
        gatewayTransactionId: payment.transactionId,
        paymentDate: payment.createdAt,
        parentId: parent?.id || 'N/A',
        parentName,
        vendorId: vendor?.id || 'N/A',
        vendorName,
        classPackageId: classPackage?.id || 'N/A',
        classPackageName: classPackage?.title || 'N/A',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      };
    });
  }

  private getAgeRange(ageGroup: AgeGroup): { minAge: number; maxAge: number } {
    switch (ageGroup) {
      case AgeGroup.INFANT:
        return { minAge: 0, maxAge: 2 };
      case AgeGroup.TODDLER:
        return { minAge: 2, maxAge: 4 };
      case AgeGroup.PRESCHOOL:
        return { minAge: 4, maxAge: 6 };
      case AgeGroup.ELEMENTARY:
        return { minAge: 6, maxAge: 12 };
      case AgeGroup.TEEN:
        return { minAge: 12, maxAge: 18 };
      default:
        return { minAge: 0, maxAge: 18 };
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  private createPaginationInfo(total: number, page: number, limit: number): PaginationInfo {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async listUsers(filters?: AdminUserListFilterDto): Promise<PaginatedUserListResponse> {
    const where: Prisma.UserWhereInput = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isEmailVerified !== undefined) {
      where.isEmailVerified = filters.isEmailVerified;
    }

    if (filters?.searchTerm) {
      where.OR = [
        { email: { contains: filters.searchTerm, mode: 'insensitive' } },
        { firstName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { lastName: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Apply pagination
    const page = filters?.pagination?.page || 1;
    const limit = filters?.pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where,
      include: {
        parent: {
          include: {
            children: true,
          },
        },
        vendor: {
          include: {
            profiles: true,
            classPackages: {
              include: {
                ageGroups: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Filter by age group if specified
    let filteredUsers = users;
    if (filters?.ageGroup) {
      const { minAge, maxAge } = this.getAgeRange(filters.ageGroup);
      
      filteredUsers = users.filter(user => {
        if (user.role === UserRole.PARENT && user.parent?.children) {
          // For parents, check if any child falls in the age range
          return user.parent.children.some(child => {
            const age = this.calculateAge(child.dateOfBirth);
            return age >= minAge && age <= maxAge;
          });
        } else if (user.role === UserRole.VENDOR && user.vendor?.classPackages) {
          // For vendors, check if any class package targets the age group
          return user.vendor.classPackages.some(pkg => 
            pkg.ageGroups?.some(ageGroup => 
              ageGroup.minAge <= maxAge && ageGroup.maxAge >= minAge
            )
          );
        }
        return false;
      });
    }

    const items = filteredUsers.map(user => {
      const vendorProfile = user.vendor?.profiles?.[0];
      return {
        id: user.vendor?.id || user.parent?.id || user.id,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        secondaryPhoneNumber: user.secondaryPhoneNumber,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        termsAccepted: user.termsAccepted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        // Vendor specific fields
        businessName: vendorProfile?.businessName,
        businessDescription: vendorProfile?.description,
        // Parent specific fields
        childrenCount: user.parent?.children?.length,
      };
    });

    return {
      items,
      pagination: this.createPaginationInfo(total, page, limit),
    };
  }

  async listVendors(filters?: Omit<AdminUserListFilterDto, 'role'>): Promise<PaginatedUserListResponse> {
    return this.listUsers({ ...filters, role: UserRole.VENDOR });
  }

  async listParents(filters?: Omit<AdminUserListFilterDto, 'role'>): Promise<PaginatedUserListResponse> {
    return this.listUsers({ ...filters, role: UserRole.PARENT });
  }
} 