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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleSlotInput } from './schedule-slot.input';
import { CancellationPolicyType, ClassPackageStatus } from '@prisma/client';

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

  @Field(() => [ScheduleSlotInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotInput)
  scheduleSlots?: ScheduleSlotInput[];

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