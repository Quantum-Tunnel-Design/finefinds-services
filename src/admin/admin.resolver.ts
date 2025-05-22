import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminDashboardDataDto } from './dto/admin-dashboard-data.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => AdminDashboardDataDto, {
    name: 'adminDashboardData',
    description: 'Retrieves dashboard data for administrators, including metrics and monthly payment trends. Requires ADMIN privileges.'
  })
  async getAdminDashboardData(
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true, description: 'Optional date range (startDate, endDate) to filter data.' })
    filters?: DateRangeFilterDto,
  ): Promise<AdminDashboardDataDto> {
    return this.adminService.getDashboardData(filters);
  }
} 