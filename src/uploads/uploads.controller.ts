import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User as UserModel } from '@prisma/client'; // Assuming Prisma User model for CurrentUser
import { UploadsService } from './uploads.service';
import { FileUploadResponseDto } from './dto/file-upload.response.dto';
import { FileUploadDto } from './dto/file-upload.dto'; // For Swagger @ApiBody

@ApiTags('Uploads (REST)')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single file (Authenticated Users Only)',
    description: 
      'Allows any authenticated user to upload a file. ' +
      'A context can be provided in the request body to help categorize the upload. ' +
      'Returns the URL and S3 key of the uploaded file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully.',
    type: FileUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid file or input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserModel,
    @Body('context') context?: string, // Extract context from body
  ): Promise<FileUploadResponseDto> {
    if (!file) {
        throw new BadRequestException('No file provided in the \'file\' field.');
    }
    return this.uploadsService.uploadFile(file, user.id, context);
  }
} 