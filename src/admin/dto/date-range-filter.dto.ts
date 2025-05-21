import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering data (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true }) // GraphQL String for date strings
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering data (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true }) // GraphQL String for date strings
  endDate?: string;
} 