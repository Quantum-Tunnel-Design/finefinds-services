import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model'; // Assuming User model path
import { Category } from '../../categories/models/category.model'; // Assuming Category model path
import { Tag } from '../../tags/models/tag.model'; // Assuming Tag model path
import { GalleryImage } from './gallery-image.model';

@ObjectType()
export class VendorProfile {
  @Field(() => ID)
  id: string;

  @Field(() => User, { description: 'The user this profile belongs to' })
  user?: User; // Resolved by a field resolver

  @Field(() => String, { nullable: true })
  profileLogoUrl?: string;

  @Field(() => String, { nullable: true })
  coverImageUrl?: string;

  @Field(() => String)
  businessName: string;

  @Field(() => String)
  location: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  contactNumber: string;

  @Field(() => String, { nullable: true })
  websiteUrl?: string;

  @Field(() => String, { nullable: true })
  facebookUrl?: string;

  @Field(() => String, { nullable: true })
  instagramUrl?: string;

  @Field(() => String, { nullable: true })
  linkedInUrl?: string;

  @Field(() => String, { nullable: true })
  twitterUrl?: string;

  @Field(() => String, { nullable: true })
  tiktokUrl?: string;

  @Field(() => String, { nullable: true })
  youtubeUrl?: string;

  @Field(() => String, { nullable: true })
  bankName?: string;

  @Field(() => String, { nullable: true })
  accountNumber?: string;

  @Field(() => String, { nullable: true })
  bankBranch?: string;

  @Field(() => Boolean, { defaultValue: false })
  approved: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Relational fields - these will be resolved by field resolvers
  @Field(() => [Category], { nullable: 'itemsAndList' })
  categories?: Category[];

  @Field(() => [Tag], { nullable: 'itemsAndList' })
  tags?: Tag[];

  @Field(() => [GalleryImage], { nullable: 'itemsAndList' })
  galleryImages?: GalleryImage[];
} 