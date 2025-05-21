import { ApiProperty } from '@nestjs/swagger';

export class MonthlyPaymentDataDto {
  @ApiProperty({ description: 'Month in YYYY-MM format.', example: '2023-01' })
  month: string;

  @ApiProperty({ description: 'Total payment amount for the month.', example: 5500 })
  totalAmount: number;
} 