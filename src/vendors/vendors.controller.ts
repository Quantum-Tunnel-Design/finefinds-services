import { Controller, Post, Body, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VendorsService } from './vendors.service';
import { CreateBusinessProfileInput } from './dto/create-business-profile.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('business-profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  async createBusinessProfile(
    @Req() req,
    @Body() input: CreateBusinessProfileInput,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.vendorsService.createBusinessProfile(req.user.id, input, {
      logo: files.logo?.[0],
      coverImage: files.coverImage?.[0],
      gallery: files.gallery,
    });
  }
} 