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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassPackagesService } from './class-packages.service';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ClassPackage } from '@prisma/client'; // For return types

@Controller('class-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassPackagesController {
  constructor(private readonly classPackagesService: ClassPackagesService) {}

  @Post()
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('coverImage'))
  async createClassPackage(
    @Req() req,
    @Body() input: CreateClassPackageInput,
    @UploadedFile() coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    return this.classPackagesService.createClassPackage(
      req.user.id,
      input,
      coverImageFile,
    );
  }

  @Put(':id')
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('coverImage'))
  async updateClassPackage(
    @Req() req,
    @Param('id', ParseUUIDPipe) classPackageId: string,
    @Body() input: UpdateClassPackageInput,
    @UploadedFile() coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    return this.classPackagesService.updateClassPackage(
      req.user.id,
      classPackageId,
      input,
      coverImageFile,
    );
  }

  // Removed getVendorClassPackages (GET /vendor) - Migrated to GraphQL query myClassPackages

  // Removed getClassPackage (GET /:id) - Migrated to GraphQL query classPackage(id)
  
  // Removed deleteClassPackage (DELETE /:id) - Migrated to GraphQL mutation deleteMyClassPackage(id)
} 