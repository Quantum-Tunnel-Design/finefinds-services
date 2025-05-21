import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from './gender.enum';

@InputType()
export class UpdateChildInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;
} 