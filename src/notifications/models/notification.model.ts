// src/users/models/user.model.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

@ObjectType()
export class Notification {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  read: boolean;

  @Field()
  type: string;

  @Field()
  data: Record<string, any>;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}