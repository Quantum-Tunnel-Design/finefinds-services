import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';

@InputType()
export class ResetAdminPasswordInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}[\]|\\:;"'<>,.?/])[A-Za-z\d!@#$%^&*()\-_=+{}[\]|\\:;"'<>,.?/]{8,16}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;
} 