import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Gender } from './gender.enum';

@ObjectType()
export class Child {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Gender)
  gender: Gender;

  @Field()
  dateOfBirth: Date;

  @Field(() => ID)
  parentId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 