import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

@InputType()
export class UpdateParentProfileInput {
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
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+94[0-9]{7,15}$/, {
    message: 'Phone number must start with +94 followed by 7-15 digits',
  })
  phoneNumber: string;
} 