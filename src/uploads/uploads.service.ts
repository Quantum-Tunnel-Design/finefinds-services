import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { FileUploadResponseDto } from './dto/file-upload.response.dto';

@Injectable()
export class UploadsService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    // Add other general mime types as needed
  ];

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  private validateFile(
    file: Express.Multer.File,
    allowedTypes?: string[],
    maxSize?: number,
  ): void {
    const currentMaxSize = maxSize || this.MAX_FILE_SIZE;
    const currentAllowedTypes = allowedTypes || this.ALLOWED_MIME_TYPES;

    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (file.size > currentMaxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${currentMaxSize / (1024 * 1024)}MB.`,
      );
    }
    if (!currentAllowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${currentAllowedTypes.join(', ')}.`,
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    context: string = 'general',
    // Future: Pass allowedTypes and maxSize from controller if context-specific validation is needed
  ): Promise<FileUploadResponseDto> {
    this.validateFile(file);

    const timestamp = new Date().getTime();
    const originalNameNoExt = file.originalname.split('.').slice(0, -1).join('.') || 'file';
    const extension = file.originalname.split('.').pop() || 'bin';
    
    // Sanitize originalNameNoExt to prevent path traversal or invalid characters in S3 key
    const sanitizedOriginalName = originalNameNoExt.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const sanitizedContext = context.replace(/[^a-zA-Z0-9_.-]/g, '_');

    const fileName = `${timestamp}-${sanitizedOriginalName}.${extension}`;
    const s3Key = `uploads/${userId}/${sanitizedContext}/${fileName}`;

    try {
      const url = await this.s3Service.uploadFile(
        file.buffer,
        s3Key,
        file.mimetype,
      );
      return { url, key: s3Key };
    } catch (error) {
      console.error('Error uploading file to S3 via UploadsService:', error);
      throw new BadRequestException('Failed to upload file. Please try again.');
    }
  }
} 