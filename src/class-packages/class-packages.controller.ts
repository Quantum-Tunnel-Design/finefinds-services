import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Put,
  Param,
  Get,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClassPackagesService } from './class-packages.service';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ClassPackage } from '@prisma/client'; // For return types
import { S3Service } from '../s3/s3.service';
import { ClassPackageType } from './graphql-types/class-package.type'; // Added

@ApiTags('Class Packages (Vendor REST)')
@ApiBearerAuth()
@Controller('class-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassPackagesController {
  constructor(
    private readonly classPackagesService: ClassPackagesService,
    private readonly s3Service: S3Service,
  ) {}

  private validateImage(file: Express.Multer.File, type: string): void {
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      throw new BadRequestException(`${type} size should not exceed 5MB.`);
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      throw new BadRequestException(`Invalid ${type} file type. Only JPG, PNG, GIF are allowed.`);
    }
  }

  private async uploadImage(
    file: Express.Multer.File,
    vendorId: string,
    folder: string,
    fileNamePrefix?: string,
  ): Promise<string> {
    const timestamp = new Date().getTime();
    const originalName = file.originalname.split('.').slice(0, -1).join('.');
    const extension = file.originalname.split('.').pop();
    const fileName = `${fileNamePrefix ? fileNamePrefix + '-' : ''}${originalName}-${timestamp}.${extension}`;
    const path = `vendors/${vendorId}/${folder}/${fileName}`;
    try {
      return await this.s3Service.uploadFile(file.buffer, path, file.mimetype);
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new BadRequestException('Failed to upload image.');
    }
  }

  @Post()
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiOperation({ summary: 'Create a new class package (Vendor Only)', description: 'Allows a vendor to create a new class package. The cover image is optional.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Class package data and optional cover image file.',
    type: CreateClassPackageInput,
  })
  @ApiResponse({ status: 201, description: 'Class package created successfully.', type: ClassPackageType })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data or file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not a vendor.' })
  async createClassPackage(
    @Req() req,
    @Body() input: CreateClassPackageInput,
    @UploadedFile() coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    let coverImageUrl: string | undefined = undefined;
    if (coverImageFile) {
      this.validateImage(coverImageFile, 'cover image');
      coverImageUrl = await this.uploadImage(coverImageFile, req.user.id, 'class-package-covers');
    }
    if (coverImageUrl === undefined && input.coverImageUrl) {
        coverImageUrl = input.coverImageUrl;
    }

    return this.classPackagesService.createClassPackage(
      req.user.id,
      { ...input, coverImageUrl },
    );
  }

  @Put(':id')
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiOperation({ summary: 'Update an existing class package (Vendor Only)', description: 'Allows a vendor to update their class package. The cover image is optional. Providing a null coverImageUrl in the body will remove the existing image if no new file is uploaded.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Updated class package data and optional new cover image file.',
    type: UpdateClassPackageInput,
  })
  @ApiResponse({ status: 200, description: 'Class package updated successfully.', type: ClassPackageType })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data or file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not a vendor or does not own the package.' })
  @ApiResponse({ status: 404, description: 'Not Found. Class package with the given ID not found.' })
  async updateClassPackage(
    @Req() req,
    @Param('id', ParseUUIDPipe) classPackageId: string,
    @Body() input: UpdateClassPackageInput,
    @UploadedFile() coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    let coverImageUrl: string | undefined | null = input.coverImageUrl;

    if (coverImageFile) {
      this.validateImage(coverImageFile, 'cover image');
      coverImageUrl = await this.uploadImage(coverImageFile, req.user.id, 'class-package-covers', classPackageId);
    }

    return this.classPackagesService.updateClassPackage(
      req.user.id,
      classPackageId,
      { ...input, coverImageUrl },
    );
  }

  // Removed getVendorClassPackages (GET /vendor) - Migrated to GraphQL query myClassPackages

  // Removed getClassPackage (GET /:id) - Migrated to GraphQL query classPackage(id)
  
  // Removed deleteClassPackage (DELETE /:id) - Migrated to GraphQL mutation deleteMyClassPackage(id)
} 