import { ApiProperty } from '@nestjs/swagger';
import { VendorRevenueMetricsDto } from './vendor-revenue-metrics.dto';
import { MonthlyPaymentDataDto } from '../../admin/dto/monthly-payment-data.dto'; // Reusing from admin
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class VendorDashboardDataDto {
  @ApiProperty({ type: () => VendorRevenueMetricsDto })
  @ValidateNested()
  @Type(() => VendorRevenueMetricsDto)
  metrics: VendorRevenueMetricsDto;

  @ApiProperty({ type: () => [MonthlyPaymentDataDto] })
  @ValidateNested({ each: true })
  @Type(() => MonthlyPaymentDataDto)
  monthlyPayments: MonthlyPaymentDataDto[];
} 