import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsDate, IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
class ChildInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
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

@InputType()
export class ParentSignUpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Phone number must be 7-15 digits with optional + prefix',
  })
  phoneNumber: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @Field(() => [ChildInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildInput)
  @IsNotEmpty()
  children: ChildInput[];

  @Field()
  @IsBoolean()
  @IsNotEmpty()
  termsAccepted: boolean;
} 