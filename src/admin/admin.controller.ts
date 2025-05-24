import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';
import { AdminUserListFilterDto } from './dto/admin-user-list-filter.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('export/users')
  @ApiOperation({
    summary: 'Export users to Excel',
    description: 'Exports a filtered list of all users to an Excel file. The export includes user details such as name, email, phone, verification status, and role-specific information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing user data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportUsersToExcel(
    @Res() res: Response,
    @Query() filters?: AdminUserListFilterDto,
  ): Promise<void> {
    const buffer = await this.adminService.exportUsersToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=users.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('export/vendors')
  @ApiOperation({
    summary: 'Export vendors to Excel',
    description: 'Exports a filtered list of all vendors to an Excel file. The export includes vendor details such as business name, description, contact information, and verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing vendor data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportVendorsToExcel(
    @Res() res: Response,
    @Query() filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<void> {
    const buffer = await this.adminService.exportVendorsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=vendors.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('export/parents')
  @ApiOperation({
    summary: 'Export parents to Excel',
    description: 'Exports a filtered list of all parents to an Excel file. The export includes parent details such as name, email, phone, children count, and verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing parent data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportParentsToExcel(
    @Res() res: Response,
    @Query() filters?: Omit<AdminUserListFilterDto, 'role'>,
  ): Promise<void> {
    const buffer = await this.adminService.exportParentsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=parents.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('export/metrics')
  @ApiOperation({
    summary: 'Export admin metrics to Excel',
    description: 'Exports admin dashboard metrics to an Excel file. The export includes total online payments, total number of payments, total users, parents registered, and vendors registered.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing admin metrics',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportMetricsToExcel(
    @Res() res: Response,
    @Query() filters?: DateRangeFilterDto,
  ): Promise<void> {
    const buffer = await this.adminService.exportMetricsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=admin_metrics.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('export/transactions')
  @ApiOperation({
    summary: 'Export transactions to Excel',
    description: 'Exports a list of all transactions to an Excel file. The export includes transaction details such as ID, payment date, amount, status, and associated parent/vendor information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing transaction data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportTransactionsToExcel(
    @Res() res: Response,
    @Query() filters?: DateRangeFilterDto,
  ): Promise<void> {
    const buffer = await this.adminService.exportTransactionsToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=transactions.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('export/payment-chart')
  @ApiOperation({
    summary: 'Export payment chart data to Excel',
    description: 'Exports payment chart data to an Excel file. The export includes monthly payment trends with total amounts for each month.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file containing payment chart data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportPaymentChartToExcel(
    @Res() res: Response,
    @Query() filters?: DateRangeFilterDto,
  ): Promise<void> {
    const buffer = await this.adminService.exportPaymentChartToExcel(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=payment_chart.xlsx',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }
} 