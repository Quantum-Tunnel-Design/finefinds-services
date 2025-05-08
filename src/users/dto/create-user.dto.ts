import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

@InputType()
export class CreateUserDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  cognitoSub: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
} 