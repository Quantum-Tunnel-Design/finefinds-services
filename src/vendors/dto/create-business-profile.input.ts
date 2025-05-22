import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateBusinessProfileInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Contact number must contain 7-15 digits with optional + prefix',
  })
  contactNumber: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  bankName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{8,20}$/, {
    message: 'Account number must be 8-20 digits',
  })
  accountNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  branch?: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  categories: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: string[];

  // Fields for image URLs, to be populated by separate upload mutations
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