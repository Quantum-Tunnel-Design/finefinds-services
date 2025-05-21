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
import { CancellationPolicyType, ClassPackageStatus } from '@prisma/client';
import { SchedulingType } from './scheduling-type.enum';
import { CustomDatesRecurrenceInput } from './custom-date-slot.input';
import { DailyRecurrenceInput } from './daily-recurrence.input';
import { WeeklyRecurrenceInput } from './weekly-recurrence.input';

@InputType()
export class UpdateClassPackageInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  beforeYouComeInstructions?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerChild?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty({ each: true })
  ageGroupIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags?: string[];

  @Field(() => SchedulingType, { nullable: true })
  @IsOptional()
  @IsEnum(SchedulingType)
  schedulingType?: SchedulingType;

  @Field(() => CustomDatesRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.CUSTOM_DATES || (o.schedulingType === undefined && o.customDatesInput !== undefined))
  @ValidateNested()
  @Type(() => CustomDatesRecurrenceInput)
  customDatesInput?: CustomDatesRecurrenceInput;

  @Field(() => DailyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.DAILY || (o.schedulingType === undefined && o.dailyRecurrenceInput !== undefined))
  @ValidateNested()
  @Type(() => DailyRecurrenceInput)
  dailyRecurrenceInput?: DailyRecurrenceInput;

  @Field(() => WeeklyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.WEEKLY || (o.schedulingType === undefined && o.weeklyRecurrenceInput !== undefined))
  @ValidateNested()
  @Type(() => WeeklyRecurrenceInput)
  weeklyRecurrenceInput?: WeeklyRecurrenceInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(CancellationPolicyType)
  cancellationPolicyType?: CancellationPolicyType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescheduleDaysBefore?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus;
} 