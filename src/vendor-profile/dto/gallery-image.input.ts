import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUrl, IsOptional, Matches } from 'class-validator';

@InputType()
export class GalleryImageInput {
  @Field(() => String, { description: 'URL of the gallery image' })
  @IsUrl({}, { message: 'Image URL must be a valid URL.' })
  @IsNotEmpty({ message: 'Image URL is required.' })
  @Matches(/\.(jpg|jpeg|png)$/i, { message: 'Image must be a .jpg or .png file.' })
  url: string;

  @Field(() => String, { description: 'Caption for the gallery image', nullable: true })
  @IsString()
  @IsOptional()
  caption?: string;

  @Field(() => Number, { description: 'Order of the image in the gallery', nullable: true })
  @IsOptional()
  order?: number;
} 