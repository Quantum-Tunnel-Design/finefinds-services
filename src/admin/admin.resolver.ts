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
import { AdminUserListViewDto, PaginatedUserListResponse } from './dto/admin-user-list-view.dto';
import { AdminUserListFilterDto } from './dto/admin-user-list-filter.dto';
import { Res } from '@nestjs/common';
import { Response } from 'express';

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

  @Query(() => PaginatedUserListResponse, {
    name: 'adminListUsers',
    description: 'Retrieves a paginated list of all users with optional filtering. Requires ADMIN privileges.',
  })
  async listUsers(
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: AdminUserListFilterDto,
  ): Promise<PaginatedUserListResponse> {
    return this.adminService.listUsers(filters);
  }

  @Query(() => PaginatedUserListResponse, {
    name: 'adminListVendors',
    description: 'Retrieves a paginated list of all vendors with optional filtering. Requires ADMIN privileges.',
  })
  async listVendors(
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<PaginatedUserListResponse> {
    return this.adminService.listVendors(filters);
  }

  @Query(() => PaginatedUserListResponse, {
    name: 'adminListParents',
    description: 'Retrieves a paginated list of all parents with optional filtering. Requires ADMIN privileges.',
  })
  async listParents(
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<PaginatedUserListResponse> {
    return this.adminService.listParents(filters);
  }

  @Query(() => Boolean, {
    name: 'exportUsersToExcel',
    description: 'Exports a filtered list of all users to an Excel file. The export includes user details such as name, email, phone, verification status, and role-specific information. Requires ADMIN privileges.',
  })
  async exportUsersToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: AdminUserListFilterDto,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportUsersToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=users.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }

  @Query(() => Boolean, {
    name: 'exportVendorsToExcel',
    description: 'Exports a filtered list of all vendors to an Excel file. The export includes vendor details such as business name, description, contact information, and verification status. Requires ADMIN privileges.',
  })
  async exportVendorsToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportVendorsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=vendors.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }

  @Query(() => Boolean, {
    name: 'exportParentsToExcel',
    description: 'Exports a filtered list of all parents to an Excel file. The export includes parent details such as name, email, phone, children count, and verification status. Requires ADMIN privileges.',
  })
  async exportParentsToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => AdminUserListFilterDto, nullable: true })
    filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportParentsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=parents.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }

  @Query(() => Boolean, {
    name: 'exportMetricsToExcel',
    description: 'Exports admin dashboard metrics to an Excel file. The export includes total online payments, total number of payments, total users, parents registered, and vendors registered. Optional date range filtering is supported. Requires ADMIN privileges.',
  })
  async exportMetricsToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true })
    filters?: DateRangeFilterDto,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportMetricsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=admin_metrics.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }

  @Query(() => Boolean, {
    name: 'exportTransactionsToExcel',
    description: 'Exports a list of all transactions to an Excel file. The export includes transaction details such as ID, payment date, amount, status, and associated parent/vendor information. Optional date range filtering is supported. Requires ADMIN privileges.',
  })
  async exportTransactionsToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true })
    filters?: DateRangeFilterDto,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportTransactionsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=transactions.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }

  @Query(() => Boolean, {
    name: 'exportPaymentChartToExcel',
    description: 'Exports payment chart data to an Excel file. The export includes monthly payment trends with total amounts for each month. Optional date range filtering is supported. Requires ADMIN privileges.',
  })
  async exportPaymentChartToExcel(
    @Res() res: Response,
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true })
    filters?: DateRangeFilterDto,
  ): Promise<boolean> {
    const buffer = await this.adminService.exportPaymentChartToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=payment_chart.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
    return true;
  }
} 