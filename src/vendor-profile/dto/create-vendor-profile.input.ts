import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMaxSize,
  ArrayNotEmpty,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GalleryImageInput } from './gallery-image.input';

@InputType()
export class CreateVendorProfileInput {
  @Field(() => String, { description: 'URL to the profile logo image' })
  @IsUrl({}, { message: 'Profile logo must be a valid URL.' })
  @IsNotEmpty({ message: 'Profile logo URL is required.' })
  @Matches(/\.(jpg|jpeg|png)$/i, { message: 'Profile logo must be a .jpg or .png image.' })
  profileLogoUrl: string;

  @Field(() => String, { description: 'URL to the cover image' })
  @IsUrl({}, { message: 'Cover image must be a valid URL.' })
  @IsNotEmpty({ message: 'Cover image URL is required.' })
  @Matches(/\.(jpg|jpeg|png)$/i, { message: 'Cover image must be a .jpg or .png image.' })
  coverImageUrl: string;

  @Field(() => String, { description: 'Business name of the vendor' })
  @IsNotEmpty({ message: 'Business name must not be empty.' })
  @MaxLength(100, { message: 'Business name must not exceed 100 characters.' })
  businessName: string;

  @Field(() => String, { description: 'Location of the business' })
  @IsNotEmpty({ message: 'Location must not be empty.' })
  @MaxLength(500, { message: 'Location must not exceed 500 characters.' })
  location: string;

  @Field(() => String, { description: 'Description of the business' })
  @IsNotEmpty({ message: 'Description must not be empty.' })
  @MaxLength(1000, { message: 'Description must not exceed 1,000 characters.' })
  description: string;

  @Field(() => [GalleryImageInput], { description: 'Gallery images (max 10)', nullable: true })
  @IsArray()
  @ArrayMaxSize(10, { message: 'You can upload a maximum of 10 gallery images.' })
  @ValidateNested({ each: true })
  @Type(() => GalleryImageInput)
  @IsOptional()
  galleryImages?: GalleryImageInput[];

  @Field(() => String, { description: 'Contact number of the business' })
  @IsNotEmpty({ message: 'Contact number must not be empty.' })
  @Matches(/^[\+]?[0-9]{7,15}$/, {
    message: 'Contact number must contain only digits (0-9), with an optional + for country code, and be between 7 to 15 digits long.',
  })
  contactNumber: string;

  @Field(() => String, { description: 'Primary website URL', nullable: true })
  @IsUrl({}, { message: 'Website URL must be a valid URL.' })
  @IsOptional()
  websiteUrl?: string;

  @Field(() => String, { description: 'Facebook profile URL', nullable: true })
  @IsUrl({}, { message: 'Facebook URL must be a valid URL.' })
  @IsOptional()
  facebookUrl?: string;

  @Field(() => String, { description: 'Instagram profile URL', nullable: true })
  @IsUrl({}, { message: 'Instagram URL must be a valid URL.' })
  @IsOptional()
  instagramUrl?: string;

  @Field(() => String, { description: 'LinkedIn profile URL', nullable: true })
  @IsUrl({}, { message: 'LinkedIn URL must be a valid URL.' })
  @IsOptional()
  linkedInUrl?: string;

  @Field(() => String, { description: 'Twitter profile URL', nullable: true })
  @IsUrl({}, { message: 'Twitter URL must be a valid URL.' })
  @IsOptional()
  twitterUrl?: string;

  @Field(() => String, { description: 'TikTok profile URL', nullable: true })
  @IsUrl({}, { message: 'TikTok URL must be a valid URL.' })
  @IsOptional()
  tiktokUrl?: string;

  @Field(() => String, { description: 'YouTube channel URL', nullable: true })
  @IsUrl({}, { message: 'YouTube URL must be a valid URL.' })
  @IsOptional()
  youtubeUrl?: string;

  @Field(() => String, { description: 'Name of the bank', nullable: true })
  @MaxLength(100, { message: 'Bank name must not exceed 100 characters.' })
  @IsOptional()
  bankName?: string;

  @Field(() => String, { description: 'Bank account number', nullable: true })
  @Matches(/^[0-9]{8,20}$/, { message: 'Account number must be between 8 to 20 digits.' })
  @IsOptional()
  accountNumber?: string;

  @Field(() => String, { description: 'Bank branch', nullable: true })
  @MaxLength(100, { message: 'Bank branch must not exceed 100 characters.' })
  @IsOptional()
  bankBranch?: string;

  @Field(() => [ID], { description: 'List of category IDs to associate with the profile' })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one category must be assigned.' })
  @IsString({ each: true, message: 'Each category ID must be a string.' })
  categoryIds: string[];

  @Field(() => [ID], { description: 'List of tag IDs to associate with the profile' })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one tag must be assigned.' })
  @IsString({ each: true, message: 'Each tag ID must be a string.' })
  tagIds: string[];
} 