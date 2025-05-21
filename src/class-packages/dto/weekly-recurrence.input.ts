import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsInt, Min, ValidateIf, IsOptional, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { DayOfWeek } from './day-of-week.enum';

@InputType()
export class WeeklyRecurrenceInput {
  @Field()
  @IsNotEmpty()
  @IsDate()
  recurrenceStartDate: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @ValidateIf(o => o.recurrenceStartDate)
  recurrenceEndDate?: Date; // If null, recurs indefinitely (or up to a system max)

  @Field(() => [DayOfWeek])
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];

  @Field()
  @IsNotEmpty()
  @IsDate()
  slotStartTime: Date; // Time for each selected day

  @Field()
  @IsNotEmpty()
  @IsDate()
  slotEndTime: Date; // Time for each selected day

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  availableSlotsPerOccurrence: number;
} 