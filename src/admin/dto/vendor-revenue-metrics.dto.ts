import { ApiProperty } from '@nestjs/swagger';
import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class VendorRevenueMetricsDto {
  @ApiProperty({ description: 'Total pending payout for the vendor to date.', example: 5750.25 })
  @Field(() => Float)
  pendingPayoutToDate: number;

  @ApiProperty({ description: 'Total payments received for the vendor within the selected date range.', example: 1500.50 })
  @Field(() => Float)
  totalPaymentsInRange: number;
} 