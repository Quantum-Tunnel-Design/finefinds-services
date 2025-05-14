// src/users/models/user.model.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  cognitoSub: string; // Changed from cognitoId

  @Field()
  firstName: string; // Changed from name

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  role: UserRole;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}