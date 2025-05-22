import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { AdminUserViewDto } from './dto/admin-user-view.dto';
import { AdminUserDetailsDto } from './dto/admin-user-details.dto';
import { AdminUpdateUserStatusInput } from './dto/admin-update-user-status.input';
import { VendorRevenueMetricsDto } from '../vendors/dto/vendor-revenue-metrics.dto';
import { DateRangeFilterDto } from './dto/date-range-filter.dto';

@Resolver(() => AdminUserViewDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersResolver {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Query(() => [AdminUserViewDto], {
    name: 'adminListAllUsers',
    description: 'Lists all users in the platform. Admin role required. Optionally shows soft-deleted users.',
  })
  async listAllUsers(
    @Args('showDeleted', { type: () => Boolean, nullable: true, defaultValue: false, description: 'Set to true to include soft-deleted users in the list.' })
    showDeleted: boolean,
  ): Promise<AdminUserViewDto[]> {
    return this.adminUsersService.listAllUsers(showDeleted);
  }

  @Query(() => AdminUserDetailsDto, {
    name: 'adminGetUserDetails',
    nullable: true,
    description: 'Retrieves detailed information for a specific user by ID. Admin role required.',
  })
  async getUserDetails(
    @Args('userId', { type: () => ID, description: "The unique identifier of the user to retrieve details for." }) userId: string,
  ): Promise<AdminUserDetailsDto | null> {
    return this.adminUsersService.getUserDetailsById(userId);
  }

  @Mutation(() => AdminUserViewDto, {
    name: 'adminUpdateUserStatus',
    description: 'Updates the active status or soft-delete status of a user. Admin role required. Returns the updated user view.',
  })
  async updateUserStatus(
    @Args('userId', { type: () => ID, description: "The unique identifier of the user whose status is to be updated." }) userId: string,
    @Args('input', { type: () => AdminUpdateUserStatusInput, description: "The update data specifying new status flags." }) input: AdminUpdateUserStatusInput,
  ): Promise<AdminUserViewDto> {
    return this.adminUsersService.updateUserStatus(userId, input);
  }

  @Query(() => VendorRevenueMetricsDto, {
    name: 'adminGetVendorRevenueStats',
    nullable: true,
    description: "Retrieves revenue statistics for a specific vendor. Admin role required. Used in admin panel for vendor details view.",
  })
  async getVendorRevenueStats(
    @Args('vendorId', { type: () => ID, description: "The unique identifier of the vendor to get revenue stats for." }) vendorId: string,
    @Args('filters', { type: () => DateRangeFilterDto, nullable: true, description: 'Optional date range to filter revenue statistics.' })
    filters?: DateRangeFilterDto,
  ): Promise<VendorRevenueMetricsDto | null> {
    return this.adminUsersService.getVendorRevenueStats(vendorId, filters);
  }
} 