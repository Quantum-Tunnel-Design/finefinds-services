import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

registerEnumType(UserRole, { name: 'UserRole' });

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => UserRole)
  @IsNotEmpty()
  role: UserRole;
} 