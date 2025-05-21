import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChildBookingDetailDto {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  dateOfBirth: Date; // Or string if you prefer formatted
} 