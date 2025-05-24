import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field(() => String, { description: 'Name of the category' })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString({ message: 'Category name must be a string' })
  @MaxLength(50, { message: 'Category name must not exceed 50 characters' })
  name: string;

  @Field(() => String, { description: 'Description of the category', nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
} 