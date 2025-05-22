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
// import { ScheduleSlotInput } from './schedule-slot.input'; // Replaced by new recurrence inputs
import { CancellationPolicyType, ClassPackageStatus } from '@prisma/client';
import { SchedulingType } from './scheduling-type.enum';
import { CustomDatesRecurrenceInput } from './custom-date-slot.input';
import { DailyRecurrenceInput } from './daily-recurrence.input';
import { WeeklyRecurrenceInput } from './weekly-recurrence.input';

@InputType()
export class CreateClassPackageInput {
  @ApiProperty({ description: 'The name of the class package.', maxLength: 100, example: "Toddler's Art Adventure" })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'A detailed description of the class package.', maxLength: 1000, example: 'A fun and engaging art class for toddlers aged 2-4.' })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ description: 'Instructions for participants before they come to the class.', maxLength: 2000, example: 'Please wear old clothes as things might get messy!' })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  beforeYouComeInstructions: string;

  @ApiProperty({ description: 'Price per child for the class package.', type: Number, minimum: 0, example: 25.50 })
  @Field(() => Float)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  pricePerChild: number;

  @ApiProperty({ description: 'The UUID of the category this class package belongs to.', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'An array of UUIDs for the age groups this class package is suitable for.', type: [String], example: ['abf2340e-345d-7212-b456-0f03c3d5e891'] })
  @Field(() => [ID])
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty({ each: true })
  ageGroupIds: string[];

  @ApiProperty({ description: 'An array of tags for the class package.', type: [String], example: ['art', 'toddlers', 'creative'] })
  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags: string[];

  // --- Schedule related fields ---
  @ApiProperty({ description: 'The scheduling type for the class package.', enum: SchedulingType, example: SchedulingType.WEEKLY })
  @Field(() => SchedulingType)
  @IsEnum(SchedulingType)
  @IsNotEmpty()
  schedulingType: SchedulingType;

  @ApiProperty({ description: 'Input for custom date-based scheduling. Required if schedulingType is CUSTOM_DATES.', required: false, type: () => CustomDatesRecurrenceInput })
  @Field(() => CustomDatesRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.CUSTOM_DATES)
  @ValidateNested()
  @Type(() => CustomDatesRecurrenceInput)
  customDatesInput?: CustomDatesRecurrenceInput;

  @ApiProperty({ description: 'Input for daily recurrence scheduling. Required if schedulingType is DAILY.', required: false, type: () => DailyRecurrenceInput })
  @Field(() => DailyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.DAILY)
  @ValidateNested()
  @Type(() => DailyRecurrenceInput)
  dailyRecurrenceInput?: DailyRecurrenceInput;

  @ApiProperty({ description: 'Input for weekly recurrence scheduling. Required if schedulingType is WEEKLY.', required: false, type: () => WeeklyRecurrenceInput })
  @Field(() => WeeklyRecurrenceInput, { nullable: true })
  @IsOptional()
  @ValidateIf(o => o.schedulingType === SchedulingType.WEEKLY)
  @ValidateNested()
  @Type(() => WeeklyRecurrenceInput)
  weeklyRecurrenceInput?: WeeklyRecurrenceInput;
  // --- End Schedule related fields ---

  @ApiProperty({ description: 'The cancellation policy type for the class package.', enum: CancellationPolicyType, example: CancellationPolicyType.FLEXIBLE_RESCHEDULING })
  @Field(() => String)
  @IsEnum(CancellationPolicyType)
  @IsNotEmpty()
  cancellationPolicyType: CancellationPolicyType;

  @ApiProperty({ description: 'Number of days before a class a reschedule is allowed. Required if policy is FLEXIBLE_RESCHEDULING.', type: Number, minimum: 0, required: false, example: 2 })
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescheduleDaysBefore?: number; // Required if policy is FLEXIBLE_RESCHEDULING

  @ApiProperty({ description: 'The status of the class package. Defaults to DRAFT if not provided.', enum: ClassPackageStatus, required: false, example: ClassPackageStatus.DRAFT })
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus; // Defaults to DRAFT if not provided

  @ApiProperty({ description: 'URL of the cover image for the class package. Provide if image is already uploaded.', required: false, example: 'https://example.com/image.jpg' })
  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string; // For GraphQL to pass the URL
} 