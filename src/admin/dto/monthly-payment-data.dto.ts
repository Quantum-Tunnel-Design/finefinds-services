import { ApiProperty } from '@nestjs/swagger';
import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class MonthlyPaymentDataDto {
  @ApiProperty({ description: 'Month in YYYY-MM format.', example: '2023-01' })
  @Field()
  month: string;

  @ApiProperty({ description: 'Total payment amount for the month.', example: 5500 })
  @Field(() => Float)
  totalAmount: number;
} 