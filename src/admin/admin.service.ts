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

  async getDashboardData(filters?: DateRangeFilterDto): Promise<AdminDashboardDataDto> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters?.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the whole end day
      dateFilter.lte = endDate;
    }

    // Metrics
    const onlinePaymentsAggregation = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.COMPLETED, // Assuming COMPLETED status for successful payments
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    });
    const onlinePaymentsTotal = onlinePaymentsAggregation._sum.amount || 0;

    const totalUsers = await this.prisma.user.count({
      where: { createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined },
    });
    const parentsRegistered = await this.prisma.user.count({
      where: {
        role: UserRole.PARENT,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    });
    const vendorsRegistered = await this.prisma.user.count({
      where: {
        role: UserRole.VENDOR,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    });

    const metrics: DashboardMetricsDto = {
      onlinePaymentsTotal,
      totalUsers,
      parentsRegistered,
      vendorsRegistered,
    };

    // Monthly Payment Data for Graph (using raw query for grouping by month)
    // Adjust date filtering for raw query based on your DB (PostgreSQL example)
    const startDateString = filters?.startDate ? new Date(filters.startDate).toISOString() : new Date(0).toISOString(); // Default to epoch if no start date
    const endDateString = filters?.endDate
        ? new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)).toISOString()
        : new Date().toISOString(); // Default to now if no end date

    const monthlyPaymentsRaw: { year_month: string; total_amount: number }[] = await this.prisma.$queryRaw`
        SELECT
            to_char("createdAt", 'YYYY-MM') as year_month,
            SUM(amount) as total_amount
        FROM "Payment"
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
        User: true, // Parent who made the payment
        classPackageEnrollment: {
          include: {
            classPackage: {
              include: {
                vendor: { // User who is the vendor
                  include: {
                    vendorProfile: true, // To get businessName
                  },
                },
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
      const parent = payment.User;
      const enrollment = payment.classPackageEnrollment;
      const classPackage = enrollment?.classPackage;
      const vendorUser = classPackage?.vendor;
      const vendorProfile = vendorUser?.vendorProfile;

      const parentName = parent ? `${parent.firstName} ${parent.lastName}` : 'N/A';
      const vendorName = vendorProfile?.businessName || (vendorUser ? `${vendorUser.firstName} ${vendorUser.lastName}` : 'N/A');
      
      return {
        id: payment.id,
        gatewayTransactionId: payment.transactionId,
        paymentDate: payment.createdAt,
        parentId: parent?.id || 'N/A',
        parentName,
        vendorId: vendorUser?.id || 'N/A',
        vendorName,
        classPackageId: classPackage?.id || 'N/A',
        classPackageName: classPackage?.name || 'N/A',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      };
    });
  }
} 