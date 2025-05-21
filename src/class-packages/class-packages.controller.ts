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

  @Get('vendor') // Get all packages for the logged-in vendor
  @Roles(UserRole.VENDOR)
  async getVendorClassPackages(@Req() req): Promise<ClassPackage[]> {
    return this.classPackagesService.findVendorClassPackages(req.user.id);
  }

  @Get(':id') // Get a specific package, accessible by owner vendor or any authenticated user (for public view)
  @UseGuards(JwtAuthGuard) // Ensures user is authenticated, role check is inside service if needed
  async getClassPackage(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string
): Promise<ClassPackage> {
    // If the user is a vendor, we pass their ID to check ownership for potentially sensitive data
    // Otherwise, for public viewing, vendorId might be undefined or handled in service
    const vendorId = req.user.role === UserRole.VENDOR ? req.user.id : undefined;
    return this.classPackagesService.findOneClassPackage(id, vendorId);
  }

  @Delete(':id')
  @Roles(UserRole.VENDOR)
  async deleteClassPackage(
    @Req() req,
    @Param('id', ParseUUIDPipe) classPackageId: string,
  ): Promise<{ message: string }> {
    return this.classPackagesService.deleteClassPackage(req.user.id, classPackageId);
  }
} 