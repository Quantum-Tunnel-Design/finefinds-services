import { ApiProperty } from '@nestjs/swagger';
import { VendorRevenueMetricsDto } from './vendor-revenue-metrics.dto';
import { MonthlyPaymentDataDto } from '../../admin/dto/monthly-payment-data.dto'; // Reusing from admin
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class VendorDashboardDataDto {
  @ApiProperty({ type: () => VendorRevenueMetricsDto })
  @ValidateNested()
  @Type(() => VendorRevenueMetricsDto)
  @Field(() => VendorRevenueMetricsDto)
  metrics: VendorRevenueMetricsDto;

  @ApiProperty({ type: () => [MonthlyPaymentDataDto] })
  @ValidateNested({ each: true })
  @Type(() => MonthlyPaymentDataDto)
  @Field(() => [MonthlyPaymentDataDto])
  monthlyPayments: MonthlyPaymentDataDto[];
} 