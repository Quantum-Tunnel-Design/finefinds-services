import { ApiProperty } from '@nestjs/swagger';
import { DashboardMetricsDto } from './dashboard-metrics.dto';
import { MonthlyPaymentDataDto } from './monthly-payment-data.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';


export class AdminDashboardDataDto {
  @ApiProperty({ type: () => DashboardMetricsDto })
  @ValidateNested()
  @Type(() => DashboardMetricsDto)
  metrics: DashboardMetricsDto;

  @ApiProperty({ type: () => [MonthlyPaymentDataDto] })
  @ValidateNested({ each: true })
  @Type(() => MonthlyPaymentDataDto)
  monthlyPayments: MonthlyPaymentDataDto[];
} 