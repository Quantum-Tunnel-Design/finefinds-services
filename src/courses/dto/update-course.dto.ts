import { Field, InputType, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { CourseLevel } from '@prisma/client';

@InputType()
export class UpdateCourseDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Field(() => CourseLevel, { nullable: true })
  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;
} 