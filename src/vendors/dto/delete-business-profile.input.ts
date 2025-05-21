import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';

@InputType()
export class DeleteBusinessProfileInput {
  @Field()
  @IsString()
  @Matches(/^Delete$/, {
    message: 'Please type "Delete" to confirm profile deletion',
  })
  confirmation: string;
} 