import { Field, InputType, Float } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ClassPackageStatus } from '@prisma/client';

@InputType()
export class CreateClassPackageInput {
  @ApiProperty({ description: 'The title of the class package.', maxLength: 100, example: "Toddler's Art Adventure" })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'A detailed description of the class package.', maxLength: 1000, example: 'A fun and engaging art class for toddlers aged 2-4.' })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ description: 'Price for the class package.', type: Number, minimum: 0, example: 25.50 })
  @Field(() => Float)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'The ID of the vendor creating this class package.' })
  @Field()
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ description: 'The status of the class package. Defaults to DRAFT if not provided.', enum: ClassPackageStatus, required: false, example: ClassPackageStatus.DRAFT })
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ClassPackageStatus)
  status?: ClassPackageStatus;
} 