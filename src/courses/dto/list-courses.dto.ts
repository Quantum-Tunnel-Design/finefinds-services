import { Field, InputType, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { CourseLevel } from '@prisma/client';

@InputType()
export class ListCoursesDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => CourseLevel, { nullable: true })
  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  search?: string;
} 