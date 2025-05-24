// src/users/models/user.model.ts
import { Field, ObjectType } from '@nestjs/graphql';
// import { UserRole } from '@prisma/client'; // UserRole is imported but not used after removing registerEnumType
import GraphQLJSON from 'graphql-type-json';

// registerEnumType(UserRole, { name: 'UserRole' }); // Removed redundant registration

@ObjectType()
export class Notification {
  @Field()
  id: string;

  @Field()
  message: string;

  @Field()
  isRead: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: Record<string, any>;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}