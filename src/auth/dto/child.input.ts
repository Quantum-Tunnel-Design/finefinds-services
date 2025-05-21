import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEnum, IsDate, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ChildInput {
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

  @Field()
  @IsEnum(['male', 'female'])
  @IsNotEmpty()
  gender: 'male' | 'female';

  @Field()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateOfBirth: Date;
} 