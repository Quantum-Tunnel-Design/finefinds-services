import { Field, InputType, Float, Int, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
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
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CancellationPolicyType, ClassPackageStatus } from '@prisma/client';
import { SchedulingType } from './scheduling-type.enum';
import { CustomDatesRecurrenceInput } from './custom-date-slot.input';
import { DailyRecurrenceInput } from './daily-recurrence.input';
import { WeeklyRecurrenceInput } from './weekly-recurrence.input';

@InputType()
export class UpdateClassPackageInput {
  @ApiProperty({ description: 'The new name of the class package.', maxLength: 100, required: false, example: "Toddler's Awesome Art Adventure" })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'A new detailed description of the class package.', maxLength: 1000, required: false, example: 'An even more fun and engaging art class for toddlers.' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'New instructions for participants.', maxLength: 2000, required: false, example: 'Remember to bring your smiles!' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  beforeYouComeInstructions?: string;

  @ApiProperty({ description: 'New price per child.', type: Number, minimum: 0, required: false, example: 30.00 })
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerChild?: number;

  @ApiProperty({ description: 'The new UUID of the category for this class package.', required: false, example: 'e27bc10b-58dd-4372-a567-0e02b2c3d780' })
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'A new array of UUIDs for the age groups.', type: [String], required: false, example: ['bcf3450e-123d-8901-c567-1g04d4e6f902'] })
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty({ each: true })
  ageGroupIds?: string[];

  @ApiProperty({ description: 'A new array of tags for the class package.', type: [String], required: false, example: ['painting', 'toddlers', 'fun'] })
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'The new scheduling type. Can only be changed for DRAFT packages.', enum: SchedulingType, required: false, example: SchedulingType.CUSTOM_DATES })
  @Field(() => SchedulingType, { nullable: true })
  @IsOptional()
  @IsEnum(SchedulingType)
  schedulingType?: SchedulingType;

  @ApiProperty({ description: 'New input for custom date-based scheduling.', required: false, type: () => CustomDatesRecurrenceInput })
  @Field(() => CustomDatesRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.CUSTOM_DATES || (o.schedulingType === undefined && o.customDatesInput !== undefined))
  @ValidateNested()
  @Type(() => CustomDatesRecurrenceInput)
  customDatesInput?: CustomDatesRecurrenceInput;

  @ApiProperty({ description: 'New input for daily recurrence scheduling.', required: false, type: () => DailyRecurrenceInput })
  @Field(() => DailyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.DAILY || (o.schedulingType === undefined && o.dailyRecurrenceInput !== undefined))
  @ValidateNested()
  @Type(() => DailyRecurrenceInput)
  dailyRecurrenceInput?: DailyRecurrenceInput;

  @ApiProperty({ description: 'New input for weekly recurrence scheduling.', required: false, type: () => WeeklyRecurrenceInput })
  @Field(() => WeeklyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.WEEKLY || (o.schedulingType === undefined && o.weeklyRecurrenceInput !== undefined))
  @ValidateNested()
  @Type(() => WeeklyRecurrenceInput)
  weeklyRecurrenceInput?: WeeklyRecurrenceInput;

  @ApiProperty({ description: 'The new cancellation policy type.', enum: CancellationPolicyType, required: false, example: CancellationPolicyType.FIXED_COMMITMENT })
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(CancellationPolicyType)
  cancellationPolicyType?: CancellationPolicyType;

  @ApiProperty({ description: 'New number of days before a class a reschedule is allowed.', type: Number, minimum: 0, required: false, example: 1 })
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescheduleDaysBefore?: number;

  @ApiProperty({ description: 'The new status of the class package.', enum: ClassPackageStatus, required: false, example: ClassPackageStatus.PUBLISHED })
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus;

  @ApiProperty({ description: 'New URL of the cover image. Set to null to remove existing image.', required: false, example: 'https://example.com/new_image.jpg' })
  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;
} 