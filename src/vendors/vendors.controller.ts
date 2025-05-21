import { Controller, Post, Put, Delete, Body, UseGuards, Req, UseInterceptors, UploadedFiles, Get, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VendorsService } from './vendors.service';
import { CreateBusinessProfileInput } from './dto/create-business-profile.input';
import { UpdateBusinessProfileInput } from './dto/update-business-profile.input';
import { DeleteBusinessProfileInput } from './dto/delete-business-profile.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DateRangeFilterDto } from '../../admin/dto/date-range-filter.dto';
import { VendorDashboardDataDto } from './dto/vendor-dashboard-data.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('business-profile')
  @Roles(UserRole.VENDOR)
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

  @Put('business-profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  async updateBusinessProfile(
    @Req() req,
    @Body() input: UpdateBusinessProfileInput,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.vendorsService.updateBusinessProfile(req.user.id, input, {
      logo: files.logo?.[0],
      coverImage: files.coverImage?.[0],
      gallery: files.gallery,
    });
  }

  @Delete('business-profile')
  async deleteBusinessProfile(
    @Req() req,
    @Body() input: DeleteBusinessProfileInput,
  ) {
    return this.vendorsService.deleteBusinessProfile(req.user.id, input);
  }

  @Get('me/dashboard/revenue')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get revenue dashboard data for the logged-in vendor' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved vendor revenue dashboard data.', type: VendorDashboardDataDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getVendorRevenueDashboard(
    @Req() req,
    @Query() filters: DateRangeFilterDto,
  ): Promise<VendorDashboardDataDto> {
    const vendorId = req.user.id;
    return this.vendorsService.getVendorDashboardData(vendorId, filters);
  }
} 