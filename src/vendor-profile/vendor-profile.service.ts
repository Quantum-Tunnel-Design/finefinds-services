import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorProfileInput } from './dto/create-vendor-profile.input';
import { UpdateVendorProfileInput } from './dto/update-vendor-profile.input';
import { User, VendorProfile as PrismaVendorProfile, Prisma } from '@prisma/client';

@Injectable()
export class VendorProfileService {
  constructor(private prisma: PrismaService) {}

  private async validateCategoryIds(categoryIds: string[]): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = categoryIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Invalid category IDs: ${missingIds.join(', ')}`);
    }
  }

  private async validateTagIds(tagIds: string[]): Promise<void> {
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (tags.length !== tagIds.length) {
      const foundIds = tags.map(t => t.id);
      const missingIds = tagIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Invalid tag IDs: ${missingIds.join(', ')}`);
    }
  }

  async createVendorProfile(
    createVendorProfileInput: CreateVendorProfileInput,
    user: User,
  ): Promise<PrismaVendorProfile> {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can create a business profile.');
    }

    const existingProfile = await this.prisma.vendorProfile.findUnique({ 
      where: { userId: user.id } 
    });
    
    if (existingProfile) {
      throw new BadRequestException('Vendor profile already exists for this user.');
    }

    await this.validateCategoryIds(createVendorProfileInput.categoryIds);
    await this.validateTagIds(createVendorProfileInput.tagIds);

    const { categoryIds, tagIds, galleryImages: galleryImagesInput, ...profileData } = createVendorProfileInput;

    const createData: Prisma.VendorProfileCreateInput = {
      ...profileData,
      user: { connect: { id: user.id } },
      categories: {
        create: categoryIds.map(catId => ({
          category: { connect: { id: catId } },
        })),
      },
      tags: {
        create: tagIds.map(tagId => ({
          tag: { connect: { id: tagId } },
        })),
      },
    };

    if (galleryImagesInput && galleryImagesInput.length > 0) {
      createData.galleryImages = {
        create: galleryImagesInput.map(img => ({
          url: img.url,
          caption: img.caption,
          order: img.order,
        })),
      };
    }

    return this.prisma.vendorProfile.create({
      data: createData,
      include: {
        user: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        galleryImages: true,
      },
    });
  }

  async updateVendorProfile(
    id: string,
    updateVendorProfileInput: UpdateVendorProfileInput,
    currentUser: User,
  ): Promise<PrismaVendorProfile> {
    const currentProfile = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!currentProfile) {
      throw new NotFoundException(`Vendor profile with ID ${id} not found.`);
    }
    
    if (currentProfile.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile.');
    }

    const { categoryIds, tagIds, galleryImages: galleryImagesInput, ...profileData } = updateVendorProfileInput;

    if (categoryIds) await this.validateCategoryIds(categoryIds);
    if (tagIds) await this.validateTagIds(tagIds);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update scalar fields
      await tx.vendorProfile.update({
        where: { id },
        data: profileData,
      });

      // 2. Update Categories (if provided)
      if (categoryIds !== undefined) {
        await tx.vendorProfile.update({
          where: { id },
          data: {
            categories: {
              deleteMany: {},
              create: categoryIds.map(catId => ({
                category: { connect: { id: catId } },
              })),
            },
          },
        });
      }

      // 3. Update Tags (if provided)
      if (tagIds !== undefined) {
        await tx.vendorProfile.update({
          where: { id },
          data: {
            tags: {
              deleteMany: {},
              create: tagIds.map(tagId => ({
                tag: { connect: { id: tagId } },
              })),
            },
          },
        });
      }

      // 4. Update Gallery Images (if provided)
      if (galleryImagesInput !== undefined) {
        await tx.galleryImage.deleteMany({ where: { vendorProfileId: id } });
        if (galleryImagesInput.length > 0) {
          await tx.galleryImage.createMany({
            data: galleryImagesInput.map(img => ({
              vendorProfileId: id,
              url: img.url,
              caption: img.caption,
              order: img.order,
            })),
          });
        }
      }

      return tx.vendorProfile.findUniqueOrThrow({
        where: { id },
        include: {
          user: true,
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          galleryImages: true,
        },
      });
    });
  }

  async findOneByUserId(userId: string): Promise<PrismaVendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        galleryImages: true,
      },
    });
  }
  
  async findOneById(id: string): Promise<PrismaVendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        galleryImages: true,
      },
    });
  }

  async findAll(): Promise<PrismaVendorProfile[]> {
    return this.prisma.vendorProfile.findMany({
      include: {
        user: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        galleryImages: true,
      },
    });
  }
} 