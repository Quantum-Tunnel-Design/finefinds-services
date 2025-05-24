import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminDashboardDataDto } from './dto/admin-dashboard-data.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';
import { AdminTransactionListViewDto } from './dto/admin-transaction-list-view.dto';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => DashboardMetricsDto, {
    name: 'adminMetrics',
    description: 'Get key metrics for the admin dashboard including total payments, users, parents, and vendors. Requires ADMIN privileges.'
  })
  async getAdminMetrics(
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true, description: 'Optional date range (startDate, endDate) to filter metrics.' })
    filters?: DateRangeFilterDto,
  ): Promise<DashboardMetricsDto> {
    return this.adminService.getMetrics(filters);
  }

  @Query(() => AdminDashboardDataDto, {
    name: 'adminPaymentChartData',
    description: 'Retrieves payment chart data including monthly payment trends and metrics. Requires ADMIN privileges.'
  })
  async getPaymentChartData(
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true, description: 'Optional date range (startDate, endDate) to filter chart data.' })
    filters?: DateRangeFilterDto,
  ): Promise<AdminDashboardDataDto> {
    return this.adminService.getPaymentChartData(filters);
  }

  @Query(() => [AdminTransactionListViewDto], {
    name: 'adminListAllTransactions',
    description: 'Retrieves a list of all transactions. Optionally filter by date range. Requires ADMIN privileges.',
  })
  async listAllTransactions(
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true, description: 'Optional date range (startDate, endDate) to filter transactions.' })
    filters?: DateRangeFilterDto,
  ): Promise<AdminTransactionListViewDto[]> {
    return this.adminService.listAllTransactions(filters);
  }
} 