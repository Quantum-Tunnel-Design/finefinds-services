import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class GalleryImage {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  caption?: string;

  @Field(() => Number, { nullable: true })
  order?: number;

  @Field(() => Date)
  createdAt: Date;
  
  // We don't typically expose vendorProfileId directly in GraphQL model if we have a resolver for VendorProfile
  // @Field(() => ID)
  // vendorProfileId: string;
} 