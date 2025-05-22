import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType()
export class BusinessProfile {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User; // Assuming you want to expose the user relation

  @Field()
  userId: string;

  @Field()
  businessName: string;

  @Field()
  location: string;

  @Field()
  description: string;

  @Field()
  contactNumber: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  facebookUrl?: string;

  @Field({ nullable: true })
  instagramUrl?: string;

  @Field({ nullable: true })
  twitterUrl?: string;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  branch?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field(() => [String], { nullable: true })
  galleryUrls?: string[];

  @Field(() => [String])
  categories: string[];

  @Field(() => [String])
  tags: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 