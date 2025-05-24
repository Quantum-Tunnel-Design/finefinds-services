import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVendorProfileInput } from './create-vendor-profile.input';
import { GalleryImageInput } from './gallery-image.input';

@InputType()
export class UpdateVendorProfileInput extends PartialType(CreateVendorProfileInput) {
  // All fields from CreateVendorProfileInput are optional due to PartialType

  // Override galleryImages if you want specific update logic different from PartialType
  @Field(() => [GalleryImageInput], { description: 'Gallery images (max 10)', nullable: true })
  @IsArray()
  @ArrayMaxSize(10, { message: 'You can upload a maximum of 10 gallery images.' })
  @ValidateNested({ each: true })
  @Type(() => GalleryImageInput)
  @IsOptional()
  galleryImages?: GalleryImageInput[];

  // For updating categories and tags, you might want to allow adding/removing
  // or replacing them entirely. Here, we allow replacing the entire list.
  @Field(() => [ID], { description: 'List of category IDs to associate with the profile', nullable: true })
  @IsArray()
  @IsString({ each: true, message: 'Each category ID must be a string.' })
  @IsOptional()
  categoryIds?: string[];

  @Field(() => [ID], { description: 'List of tag IDs to associate with the profile', nullable: true })
  @IsArray()
  @IsString({ each: true, message: 'Each tag ID must be a string.' })
  @IsOptional()
  tagIds?: string[];
} 