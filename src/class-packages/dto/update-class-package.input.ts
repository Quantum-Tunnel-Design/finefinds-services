import { Field, InputType, Float } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ClassPackageStatus } from '@prisma/client';

@InputType()
export class UpdateClassPackageInput {
  @ApiProperty({ description: 'The title of the class package.', maxLength: 100, required: false, example: "Toddler's Art Adventure" })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ description: 'A detailed description of the class package.', maxLength: 1000, required: false, example: 'A fun and engaging art class for toddlers aged 2-4.' })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Price for the class package.', type: Number, minimum: 0, required: false, example: 25.50 })
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'The status of the class package.', enum: ClassPackageStatus, required: false, example: ClassPackageStatus.DRAFT })
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus;
} 