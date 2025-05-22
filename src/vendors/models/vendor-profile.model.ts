import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType()
export class VendorProfile {
  @Field(() => ID)
  id: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  instituteName: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  approved: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 