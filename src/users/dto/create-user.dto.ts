import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

registerEnumType(UserRole, { name: 'UserRole' });

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