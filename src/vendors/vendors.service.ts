import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates or updates a vendor profile for a user
   */
  async createOrUpdateVendorProfile(
    userId: string,
    dto: CreateVendorProfileDto | UpdateVendorProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create vendor profiles');
    }

    return this.prisma.vendorProfile.upsert({
      where: { userId },
      update: dto,
      create: {
        ...dto as CreateVendorProfileDto,
        userId,
      },
      include: { user: true },
    });
  }

  /**
   * Gets the vendor profile for the current user
   */
  async getMyVendorProfile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return profile;
  }

  /**
   * Lists all vendor profiles (admin only)
   */
  async listVendorProfiles(currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can list all vendor profiles');
    }

    return this.prisma.vendorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approves a vendor profile (admin only)
   */
  async approveVendor(vendorId: string, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve vendors');
    }

    const profile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!profile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { approved: true },
      include: { user: true },
    });
  }
} 