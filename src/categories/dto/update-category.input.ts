import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { CreateCategoryInput } from './create-category.input';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => String, { description: 'Name of the category', nullable: true })
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  @MaxLength(50, { message: 'Category name must not exceed 50 characters' })
  name?: string;

  @Field(() => String, { description: 'Description of the category', nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
} 