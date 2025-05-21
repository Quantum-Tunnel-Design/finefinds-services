import { Field, InputType, Float, Int, ID } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
// import { ScheduleSlotInput } from './schedule-slot.input'; // Replaced by new recurrence inputs
import { CancellationPolicyType, ClassPackageStatus } from '@prisma/client';
import { SchedulingType } from './scheduling-type.enum';
import { CustomDatesRecurrenceInput } from './custom-date-slot.input';
import { DailyRecurrenceInput } from './daily-recurrence.input';
import { WeeklyRecurrenceInput } from './weekly-recurrence.input';

@InputType()
export class CreateClassPackageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  beforeYouComeInstructions: string;

  @Field(() => Float)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  pricePerChild: number;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @Field(() => [ID])
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty({ each: true })
  ageGroupIds: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags: string[];

  // --- Schedule related fields ---
  @Field(() => SchedulingType)
  @IsEnum(SchedulingType)
  @IsNotEmpty()
  schedulingType: SchedulingType;

  @Field(() => CustomDatesRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.CUSTOM_DATES)
  @ValidateNested()
  @Type(() => CustomDatesRecurrenceInput)
  customDatesInput?: CustomDatesRecurrenceInput;

  @Field(() => DailyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.DAILY)
  @ValidateNested()
  @Type(() => DailyRecurrenceInput)
  dailyRecurrenceInput?: DailyRecurrenceInput;

  @Field(() => WeeklyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.WEEKLY)
  @ValidateNested()
  @Type(() => WeeklyRecurrenceInput)
  weeklyRecurrenceInput?: WeeklyRecurrenceInput;
  // --- End Schedule related fields ---

  @Field(() => String)
  @IsEnum(CancellationPolicyType)
  @IsNotEmpty()
  cancellationPolicyType: CancellationPolicyType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescheduleDaysBefore?: number; // Required if policy is FLEXIBLE_RESCHEDULING

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus; // Defaults to DRAFT if not provided
} 