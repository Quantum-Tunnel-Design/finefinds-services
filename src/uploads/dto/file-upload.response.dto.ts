import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileUploadResponseDto {
  @ApiProperty({
    description: 'The URL of the uploaded file.',
    example: 'https://your-s3-bucket.s3.amazonaws.com/uploads/user123/avatar/image.png',
  })
  @Field()
  url: string;

  @ApiProperty({
    description: 'The key (path) of the file in the S3 bucket.',
    example: 'uploads/user123/avatar/image.png',
  })
  @Field()
  key: string;
} 