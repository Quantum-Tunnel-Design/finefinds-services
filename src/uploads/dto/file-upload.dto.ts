import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file to upload.',
    required: true,
  })
  file: any; // In Swagger, this will be represented as a file upload field

  @ApiProperty({
    description: 'An optional context for the upload (e.g., \'avatar\', \'class-cover\', \'business-logo\'). Helps in organizing files.',
    example: 'avatar',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  context?: string;
} 