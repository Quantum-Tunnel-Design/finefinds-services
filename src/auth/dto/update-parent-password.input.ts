import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';

@InputType()
export class UpdateParentPasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

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

  @Field()
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
} 