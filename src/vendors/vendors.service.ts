import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { User, UserRole } from '@prisma/client';
import { CreateBusinessProfileInput } from './dto/create-business-profile.input';
import { UpdateBusinessProfileInput } from './dto/update-business-profile.input';
import { DeleteBusinessProfileInput } from './dto/delete-business-profile.input';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private auditService: AuditService,
  ) {}

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

  async createBusinessProfile(userId: string, input: CreateBusinessProfileInput, files: {
    logo?: Express.Multer.File;
    coverImage?: Express.Multer.File;
    gallery?: Express.Multer.File[];
  }): Promise<any> {
    // Check if user is a vendor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true },
    });

    if (!user || user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create business profiles');
    }

    // Check if profile already exists
    if (user.businessProfile) {
      throw new BadRequestException('Business profile already exists');
    }

    // Validate image files
    if (files.logo) {
      this.validateImage(files.logo, 'logo');
    }
    if (files.coverImage) {
      this.validateImage(files.coverImage, 'cover image');
    }
    if (files.gallery) {
      if (files.gallery.length > 10) {
        throw new BadRequestException('Maximum 10 gallery images allowed');
      }
      files.gallery.forEach(image => this.validateImage(image, 'gallery image'));
    }

    // Upload images to S3
    const logoUrl = files.logo ? await this.uploadImage(files.logo, 'logo') : null;
    const coverImageUrl = files.coverImage ? await this.uploadImage(files.coverImage, 'cover') : null;
    const galleryUrls = files.gallery ? await Promise.all(
      files.gallery.map(image => this.uploadImage(image, 'gallery'))
    ) : [];

    // Create business profile
    const profile = await this.prisma.businessProfile.create({
      data: {
        userId,
        businessName: input.businessName,
        location: input.location,
        description: input.description,
        contactNumber: input.contactNumber,
        website: input.website,
        facebookUrl: input.facebookUrl,
        instagramUrl: input.instagramUrl,
        twitterUrl: input.twitterUrl,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        branch: input.branch,
        logoUrl,
        coverImageUrl,
        galleryUrls,
        categories: input.categories,
        tags: input.tags,
      },
    });

    return profile;
  }

  async updateBusinessProfile(
    userId: string,
    input: UpdateBusinessProfileInput,
    files?: {
      logo?: Express.Multer.File;
      coverImage?: Express.Multer.File;
      gallery?: Express.Multer.File[];
    },
  ) {
    // Get current profile
    const currentProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!currentProfile) {
      throw new NotFoundException('Business profile not found');
    }

    // Validate image files if provided
    if (files?.logo) {
      this.validateImage(files.logo, 'logo');
    }
    if (files?.coverImage) {
      this.validateImage(files.coverImage, 'cover image');
    }
    if (files?.gallery) {
      if (files.gallery.length > 10) {
        throw new BadRequestException('Maximum 10 gallery images allowed');
      }
      files.gallery.forEach(image => this.validateImage(image, 'gallery image'));
    }

    // Upload new images if provided
    const logoUrl = files?.logo ? await this.uploadImage(files.logo, 'logo') : undefined;
    const coverImageUrl = files?.coverImage ? await this.uploadImage(files.coverImage, 'cover') : undefined;
    const galleryUrls = files?.gallery ? await Promise.all(
      files.gallery.map(image => this.uploadImage(image, 'gallery'))
    ) : undefined;

    // Prepare update data
    const updateData: any = {
      ...input,
      ...(logoUrl && { logoUrl }),
      ...(coverImageUrl && { coverImageUrl }),
      ...(galleryUrls && { galleryUrls }),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Get previous values for audit
    const previousValues = {
      businessName: currentProfile.businessName,
      location: currentProfile.location,
      description: currentProfile.description,
      contactNumber: currentProfile.contactNumber,
      website: currentProfile.website,
      facebookUrl: currentProfile.facebookUrl,
      instagramUrl: currentProfile.instagramUrl,
      twitterUrl: currentProfile.twitterUrl,
      bankName: currentProfile.bankName,
      accountNumber: currentProfile.accountNumber,
      branch: currentProfile.branch,
      categories: currentProfile.categories,
      tags: currentProfile.tags,
      logoUrl: currentProfile.logoUrl,
      coverImageUrl: currentProfile.coverImageUrl,
      galleryUrls: currentProfile.galleryUrls,
    };

    // Update profile
    const updatedProfile = await this.prisma.businessProfile.update({
      where: { userId },
      data: updateData,
    });

    // Log changes for audit
    await this.auditService.logProfileUpdate(
      userId,
      updatedProfile.id,
      updateData,
      previousValues,
    );

    return updatedProfile;
  }

  async deleteBusinessProfile(userId: string, input: DeleteBusinessProfileInput) {
    // Get current profile with courses
    const currentProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            courses: {
              include: {
                enrollments: true,
              },
            },
          },
        },
      },
    });

    if (!currentProfile) {
      throw new NotFoundException('Business profile not found');
    }

    // Check for scheduled classes with paid registrations
    const hasActiveEnrollments = currentProfile.user.courses.some(course => 
      course.enrollments.some(enrollment => 
        enrollment.status === 'ACTIVE' && 
        new Date(course.schedules[0]?.startTime) > new Date()
      )
    );

    if (hasActiveEnrollments) {
      throw new ForbiddenException(
        'Cannot delete profile while there are scheduled classes with active enrollments'
      );
    }

    // Archive courses instead of deleting them
    await this.prisma.course.updateMany({
      where: {
        vendorId: userId,
      },
      data: {
        status: 'ARCHIVED',
        isPublished: false,
      },
    });

    // Get profile data for audit log
    const profileData = {
      businessName: currentProfile.businessName,
      location: currentProfile.location,
      description: currentProfile.description,
      contactNumber: currentProfile.contactNumber,
      website: currentProfile.website,
      facebookUrl: currentProfile.facebookUrl,
      instagramUrl: currentProfile.instagramUrl,
      twitterUrl: currentProfile.twitterUrl,
      bankName: currentProfile.bankName,
      accountNumber: currentProfile.accountNumber,
      branch: currentProfile.branch,
      categories: currentProfile.categories,
      tags: currentProfile.tags,
      logoUrl: currentProfile.logoUrl,
      coverImageUrl: currentProfile.coverImageUrl,
      galleryUrls: currentProfile.galleryUrls,
    };

    // Delete profile
    await this.prisma.businessProfile.delete({
      where: { userId },
    });

    // Log deletion for audit
    await this.auditService.logProfileDeletion(
      userId,
      currentProfile.id,
      profileData
    );

    return {
      message: 'Business profile deleted successfully',
    };
  }

  private validateImage(file: Express.Multer.File, type: string): void {
    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException(`${type} size must not exceed 5MB`);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`${type} must be a valid image format (JPG, PNG)`);
    }

    // Check dimensions
    // Note: This would require additional image processing library
    // For now, we'll rely on client-side validation for dimensions
  }

  private async uploadImage(file: Express.Multer.File, type: string): Promise<string> {
    const key = `vendors/${type}/${Date.now()}-${file.originalname}`;
    return this.s3Service.uploadFile(file.buffer, key, file.mimetype);
  }
} 