import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VendorProfileService } from './vendor-profile.service';
import { VendorProfile } from './models/vendor-profile.model';
import { CreateVendorProfileInput } from './dto/create-vendor-profile.input';
import { UpdateVendorProfileInput } from './dto/update-vendor-profile.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Category } from '../categories/models/category.model';
import { Tag } from '../tags/models/tag.model';
import { GalleryImage } from './models/gallery-image.model';

@Resolver(() => VendorProfile)
export class VendorProfileResolver {
  constructor(private readonly vendorProfileService: VendorProfileService) {}

  @Mutation(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createVendorProfile(
    @Args('input') createVendorProfileInput: CreateVendorProfileInput,
    @CurrentUser() user: User,
  ) {
    return this.vendorProfileService.createVendorProfile(createVendorProfileInput, user);
  }

  @Mutation(() => VendorProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateVendorProfile(
    @Args('id') id: string,
    @Args('input') updateVendorProfileInput: UpdateVendorProfileInput,
    @CurrentUser() user: User,
  ) {
    return this.vendorProfileService.updateVendorProfile(id, updateVendorProfileInput, user);
  }

  @Query(() => VendorProfile, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async myVendorProfile(@CurrentUser() user: User) {
    return this.vendorProfileService.findOneByUserId(user.id);
  }

  @Query(() => VendorProfile, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async vendorProfile(@Args('id') id: string) {
    return this.vendorProfileService.findOneById(id);
  }

  @Query(() => [VendorProfile])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async vendorProfiles() {
    return this.vendorProfileService.findAll();
  }

  @ResolveField(() => [Category])
  async categories(@Parent() vendorProfile: VendorProfile) {
    const profile = await this.vendorProfileService.findOneById(vendorProfile.id);
    return profile?.categories.map(c => c.category) || [];
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() vendorProfile: VendorProfile) {
    const profile = await this.vendorProfileService.findOneById(vendorProfile.id);
    return profile?.tags.map(t => t.tag) || [];
  }

  @ResolveField(() => [GalleryImage])
  async galleryImages(@Parent() vendorProfile: VendorProfile) {
    const profile = await this.vendorProfileService.findOneById(vendorProfile.id);
    return profile?.galleryImages || [];
  }
} 