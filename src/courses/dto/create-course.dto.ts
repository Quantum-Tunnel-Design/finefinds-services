import { Field, InputType, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { CourseLevel } from '@prisma/client';

@InputType()
export class CreateCourseDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  category: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => CourseLevel)
  @IsEnum(CourseLevel)
  @IsNotEmpty()
  level: CourseLevel;
} 