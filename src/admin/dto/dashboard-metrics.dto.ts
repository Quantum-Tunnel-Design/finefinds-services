import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ description: 'Total amount from online payments.', example: 12500.75 })
  onlinePaymentsTotal: number;

  @ApiProperty({ description: 'Total number of registered users.', example: 1500 })
  totalUsers: number;

  @ApiProperty({ description: 'Number of users registered as parents.', example: 1200 })
  parentsRegistered: number;

  @ApiProperty({ description: 'Number of users registered as vendors.', example: 300 })
  vendorsRegistered: number;
} 