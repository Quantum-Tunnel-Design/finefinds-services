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
import { BusinessProfile } from './models/business-profile.model';
import { CreateBusinessProfileInput } from './dto/create-business-profile.input';
import { UpdateBusinessProfileInput } from './dto/update-business-profile.input';

@Resolver(() => VendorProfile)
export class VendorsResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Mutation(() => VendorProfile, { description: 'Creates or updates the profile for the currently authenticated vendor.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async registerVendorProfile(
    @CurrentUser() user: User,
    @Args('input', { type: () => CreateVendorProfileDto, description: 'Data for creating the vendor profile.' }) dto: CreateVendorProfileDto,
  ) {
    return this.vendorsService.createOrUpdateVendorProfile(user.id, dto);
  }

  @Mutation(() => VendorProfile, { description: 'Updates the profile for the currently authenticated vendor.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateVendorProfile(
    @CurrentUser() user: User,
    @Args('input', { type: () => UpdateVendorProfileDto, description: 'Data for updating the vendor profile.' }) dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.createOrUpdateVendorProfile(user.id, dto);
  }

  @Mutation(() => VendorProfile, { description: 'Approves a vendor profile. Requires ADMIN privileges.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveVendor(
    @CurrentUser() user: User,
    @Args('vendorId', { type: () => String, description: 'The ID of the vendor to approve.' }) vendorId: string,
  ) {
    return this.vendorsService.approveVendor(vendorId, user);
  }

  @Query(() => VendorProfile, { description: 'Retrieves the profile of the currently authenticated vendor.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async myVendorProfile(@CurrentUser() user: User) {
    return this.vendorsService.getMyVendorProfile(user.id);
  }

  @Query(() => [VendorProfile], { description: 'Lists all vendor profiles. Requires ADMIN privileges.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listVendors(@CurrentUser() user: User) {
    return this.vendorsService.listVendorProfiles(user);
  }

  @Query(() => VendorDashboardDataDto, {
    name: 'myVendorDashboardRevenue',
    description: 'Retrieves dashboard data, including revenue metrics, for the currently authenticated vendor. Supports date range filtering.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyVendorDashboardRevenue(
    @CurrentUser() user: User,
    @Args('filters', {
      type: () => DateRangeFilterDto,
      nullable: true,
      description: 'Optional date range (startDate, endDate) to filter revenue data.'
    })
    filters?: DateRangeFilterDto,
  ): Promise<VendorDashboardDataDto> {
    return this.vendorsService.getVendorDashboardData(user.id, filters);
  }

  @Mutation(() => OperationStatusDto, {
    name: 'deleteMyBusinessProfile',
    description: 'Deletes the business profile of the currently authenticated vendor. This also archives associated classes. Cannot be undone.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async deleteMyBusinessProfile(
    @CurrentUser() user: User,
    @Args('input', { type: () => DeleteBusinessProfileInput, description: 'Confirmation input for deleting the business profile.' }) input: DeleteBusinessProfileInput,
  ): Promise<OperationStatusDto> {
    await this.vendorsService.deleteBusinessProfile(user.id, input);
    return { success: true, message: 'Business profile deleted successfully.' };
  }

  @Mutation(() => BusinessProfile, {
    description: "Creates a new business profile for the authenticated vendor. Requires VENDOR role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createMyBusinessProfile(
    @CurrentUser() user: User,
    @Args('input') input: CreateBusinessProfileInput,
  ): Promise<BusinessProfile> {
    return this.vendorsService.createBusinessProfile(user.id, input) as any as BusinessProfile;
  }

  @Mutation(() => BusinessProfile, {
    description: "Updates the business profile for the authenticated vendor. Requires VENDOR role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateMyBusinessProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateBusinessProfileInput,
  ): Promise<BusinessProfile> {
    return this.vendorsService.updateBusinessProfile(user.id, input) as any as BusinessProfile;
  }
  
  @Query(() => BusinessProfile, {
    nullable: true,
    description: "Retrieves the business profile of the currently authenticated vendor. Requires VENDOR role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyBusinessProfile(@CurrentUser() user: User): Promise<BusinessProfile | null> {
    return this.vendorsService.getBusinessProfileByUserId(user.id) as any;
  }
} 