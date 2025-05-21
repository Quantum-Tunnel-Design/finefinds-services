import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering data (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering data (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
} 