import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsInt, Min, ValidateIf, IsOptional } from 'class-validator';

@InputType()
export class DailyRecurrenceInput {
  @Field()
  @IsNotEmpty()
  @IsDate()
  recurrenceStartDate: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @ValidateIf(o => o.recurrenceStartDate) // Ensure end date is after start date if provided
  // Custom validator would be needed for o.recurrenceEndDate > o.recurrenceStartDate
  recurrenceEndDate?: Date; // If null, recurs indefinitely (or up to a system max, e.g., 2 months)

  @Field() 
  @IsNotEmpty()
  // Assuming times are relative to each day of recurrence, e.g., "10:00"
  // For now, using full Date and extracting time part later.
  @IsDate()
  slotStartTime: Date; 

  @Field()
  @IsNotEmpty()
  @IsDate()
  slotEndTime: Date;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  availableSlotsPerOccurrence: number;
} 