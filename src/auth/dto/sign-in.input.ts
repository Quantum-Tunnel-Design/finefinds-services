import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class SignInInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
} 