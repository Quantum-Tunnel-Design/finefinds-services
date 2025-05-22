import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsDate, IsEnum } from 'class-validator';
import { Gender } from '../models/gender.enum';

@InputType()
export class CreateChildInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => Gender)
  @IsEnum(Gender)
  gender: Gender;

  @Field()
  @IsDate()
  dateOfBirth: Date;
}

@InputType()
export class UpdateChildInput extends PartialType(CreateChildInput) {} 