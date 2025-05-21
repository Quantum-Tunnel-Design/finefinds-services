import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminDashboardDataDto } from './dto/admin-dashboard-data.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data including metrics and monthly payment trends.' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved dashboard data.', type: AdminDashboardDataDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  async getDashboardData(
    @Query() filters: DateRangeFilterDto,
  ): Promise<AdminDashboardDataDto> {
    return this.adminService.getDashboardData(filters);
  }
} 