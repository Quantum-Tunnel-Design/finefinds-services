import { Field, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

@ObjectType()
export class AdminUserListViewDto {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  phoneNumber: string;

  @Field(() => String, { nullable: true })
  secondaryPhoneNumber?: string;

  @Field()
  isEmailVerified: boolean;

  @Field()
  isActive: boolean;

  @Field()
  termsAccepted: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => UserRole)
  role: UserRole;

  // Additional fields for vendors
  @Field(() => String, { nullable: true })
  businessName?: string;

  @Field(() => String, { nullable: true })
  businessDescription?: string;

  // Additional fields for parents
  @Field(() => Number, { nullable: true })
  childrenCount?: number;
} 