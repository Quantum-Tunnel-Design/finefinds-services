import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorProfile } from './models/vendor-profile.model';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendorDashboardDataDto } from './dto/vendor-dashboard-data.dto';
import { DateRangeFilterDto } from '../admin/dto/date-range-filter.dto';
import { DeleteBusinessProfileInput } from './dto/delete-business-profile.input';
import { OperationStatusDto } from '../common/dto/operation-status.dto';

@Resolver(() => VendorProfile)
export class VendorsResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Mutation(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async registerVendorProfile(
    @CurrentUser() user: User,
    @Args('input') dto: CreateVendorProfileDto,
  ) {
    return this.vendorsService.createOrUpdateVendorProfile(user.id, dto);
  }

  @Mutation(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateVendorProfile(
    @CurrentUser() user: User,
    @Args('input') dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.createOrUpdateVendorProfile(user.id, dto);
  }

  @Mutation(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveVendor(
    @CurrentUser() user: User,
    @Args('vendorId') vendorId: string,
  ) {
    return this.vendorsService.approveVendor(vendorId, user);
  }

  @Query(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async myVendorProfile(@CurrentUser() user: User) {
    return this.vendorsService.getMyVendorProfile(user.id);
  }

  @Query(() => [VendorProfile])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listVendors(@CurrentUser() user: User) {
    return this.vendorsService.listVendorProfiles(user);
  }

  @Query(() => VendorDashboardDataDto, { name: 'myVendorDashboardRevenue' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyVendorDashboardRevenue(
    @CurrentUser() user: User,
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true })
    filters?: DateRangeFilterDto,
  ): Promise<VendorDashboardDataDto> {
    return this.vendorsService.getVendorDashboardData(user.id, filters);
  }

  @Mutation(() => OperationStatusDto, { name: 'deleteMyBusinessProfile' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async deleteMyBusinessProfile(
    @CurrentUser() user: User,
    @Args('input') input: DeleteBusinessProfileInput,
  ): Promise<OperationStatusDto> {
    await this.vendorsService.deleteBusinessProfile(user.id, input);
    return { success: true, message: 'Business profile deleted successfully.' };
  }
} 