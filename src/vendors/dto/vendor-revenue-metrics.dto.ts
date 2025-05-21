import { ApiProperty } from '@nestjs/swagger';

export class VendorRevenueMetricsDto {
  @ApiProperty({ description: 'Total pending payout for the vendor to date.', example: 5750.25 })
  pendingPayoutToDate: number;

  @ApiProperty({ description: 'Total payments received for the vendor within the selected date range.', example: 1500.50 })
  totalPaymentsInRange: number;
} 