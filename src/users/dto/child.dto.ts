import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Gender } from './gender.enum'; // Or from @prisma/client if generated

@ObjectType()
export class ChildDto {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Gender)
  gender: Gender;

  @Field()
  dateOfBirth: Date; // Or string if you prefer formatted output
} 