import { PartialType, InputType, Field } from '@nestjs/graphql';
import { CreateBusinessProfileInput } from './create-business-profile.input';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf, ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

@InputType()
export class UpdateBusinessProfileInput extends PartialType(CreateBusinessProfileInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  // Basic E.164 format-like validation, can be more specific
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Contact number must be a valid phone number format.',
  })
  contactNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  facebookUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  instagramUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  twitterUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accountNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  branch?: string;

  // For file uploads, the actual file handling is in the service/controller
  // These fields in DTO might just indicate presence or a URL string if already uploaded
  // For this DTO, we'll assume the fields are optional and actual new file uploads are handled separately.
  // If you intend to pass base64 or specific file metadata here, adjust accordingly.

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  categories?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  // Fields for new image uploads (optional)
  // These are not part of the actual BusinessProfile model but can be used to signal new uploads
  // The service will handle the S3 upload and update the respective URL fields (logoUrl, coverImageUrl, galleryUrls)
  // This DTO doesn't directly map to these URLs for update, but to the input fields.
  
  // Note: We are extending PartialType(CreateBusinessProfileInput), so all fields from 
  // CreateBusinessProfileInput are already optional. Explicitly defining them here 
  // allows for overriding decorators if needed, or for clarity. 
  // If CreateBusinessProfileInput already has all these fields with appropriate 
  // validations, simply `export class UpdateBusinessProfileInput extends PartialType(CreateBusinessProfileInput) {}`
  // might be sufficient. However, explicit re-declaration gives more control for update-specific rules if any.

  // Optional URL fields for images, to be populated by separate upload mutations
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @IsUrl({}, { each: true })
  galleryUrls?: string[];
} 