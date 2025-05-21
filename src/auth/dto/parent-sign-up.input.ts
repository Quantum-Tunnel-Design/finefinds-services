import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEmail, IsPhoneNumber, Matches, MaxLength, MinLength, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChildInput } from './child.input';

@InputType()
export class ParentSignUpInput {
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
  password: string;

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
  confirmPassword: string;

  @Field()
  @IsPhoneNumber('LK')
  @Matches(/^\+94[0-9]{7,14}$/, {
    message: 'Phone number must start with +94 and contain 7-14 digits',
  })
  phoneNumber: string;

  @Field(() => [ChildInput])
  @ArrayMinSize(1, { message: 'At least one child is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 children allowed' })
  @ValidateNested({ each: true })
  @Type(() => ChildInput)
  children: ChildInput[];
} 