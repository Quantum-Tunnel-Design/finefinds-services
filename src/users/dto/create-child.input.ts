import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from './gender.enum';

@InputType()
export class CreateChildInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @Field(() => Gender)
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @Field()
  @Type(() => Date) // Ensure proper transformation for validation
  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;
} 