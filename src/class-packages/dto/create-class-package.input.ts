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

  @Field(() => [ScheduleSlotInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotInput)
  @IsNotEmpty()
  scheduleSlots: ScheduleSlotInput[];

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