import { Controller, Post, Delete, Get, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SavedClassPackagesService } from './saved-class-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SavedClassPackage } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Assuming you have this
import { User } from '@prisma/client'; // For CurrentUser type
import { SavedClassPackageDto } from './dto/saved-class-package.dto';

@ApiTags('Parent - Saved Class Packages')
@ApiBearerAuth()
@Controller('parent/saved-classes') // Base path for these parent-specific actions
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class SavedClassPackagesController {
  constructor(private readonly savedClassPackagesService: SavedClassPackagesService) {}

  @Post(':classPackageId')
  @ApiOperation({ summary: "Save a class package to the parent's favorites" })
  @ApiResponse({ status: 201, description: 'Class package saved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can save classes.' })
  @ApiResponse({ status: 404, description: 'Class package not found.' })
  @ApiResponse({ status: 409, description: 'Class package already saved.' })
  async addSavedClass(
    @CurrentUser() parent: User,
    @Param('classPackageId') classPackageId: string,
  ): Promise<SavedClassPackage> { // Consider returning a simpler DTO or just status
    return this.savedClassPackagesService.addSavedClass(parent.id, classPackageId);
  }

  @Delete(':classPackageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a class package from the parent's favorites" })
  @ApiResponse({ status: 204, description: 'Class package removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can remove saved classes.' })
  @ApiResponse({ status: 404, description: 'Saved class package not found.' })
  async removeSavedClass(
    @CurrentUser() parent: User,
    @Param('classPackageId') classPackageId: string,
  ): Promise<void> {
    await this.savedClassPackagesService.removeSavedClass(parent.id, classPackageId);
  }

  @Get()
  @ApiOperation({ summary: 'List all saved class packages for the parent' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved saved class packages.', type: [SavedClassPackageDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can view their saved classes.' })
  async listSavedClasses(
    @CurrentUser() parent: User,
  ): Promise<SavedClassPackageDto[]> {
    return this.savedClassPackagesService.listSavedClasses(parent.id);
  }
} 