import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Session {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  token: string;

  @Field()
  expiresAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 