import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, PaymentStatus, Prisma } from '@prisma/client';
import { AdminDashboardDataDto } from './dto/admin-dashboard-data.dto';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { MonthlyPaymentDataDto } from './dto/monthly-payment-data.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';
import { AdminTransactionListViewDto } from './dto/admin-transaction-list-view.dto';

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
} 