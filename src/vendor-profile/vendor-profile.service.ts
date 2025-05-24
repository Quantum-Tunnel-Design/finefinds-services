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

  private async getOrCreateVendorForUser(user: User) {
    let vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) {
      vendor = await this.prisma.vendor.create({ data: { userId: user.id } });
    }
    return vendor;
  }

  async createVendorProfile(
    createVendorProfileInput: CreateVendorProfileInput,
    user: User,
  ): Promise<PrismaVendorProfile> {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can create a business profile.');
    }

    const vendor = await this.getOrCreateVendorForUser(user);

    const existingProfile = await this.prisma.vendorProfile.findFirst({
      where: { vendorId: vendor.id },
    });
    if (existingProfile) {
      throw new BadRequestException('Vendor profile already exists for this vendor.');
    }

    await this.validateCategoryIds(createVendorProfileInput.categoryIds);
    await this.validateTagIds(createVendorProfileInput.tagIds);

    const { categoryIds, tagIds, galleryImages: galleryImagesInput, ...profileData } = createVendorProfileInput;

    const createData: Prisma.VendorProfileCreateInput = {
      ...profileData,
      vendor: { connect: { id: vendor.id } },
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
      galleryImages: galleryImagesInput && galleryImagesInput.length > 0 ? {
        create: galleryImagesInput.map(img => ({
          url: img.url,
          caption: img.caption,
          order: img.order,
        })),
      } : undefined,
    };

    return this.prisma.vendorProfile.create({
      data: createData,
    });
  }

  async updateVendorProfile(
    id: string,
    updateVendorProfileInput: UpdateVendorProfileInput,
    currentUser: User,
  ): Promise<PrismaVendorProfile> {
    const vendor = await this.getOrCreateVendorForUser(currentUser);
    const currentProfile = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!currentProfile) {
      throw new NotFoundException(`Vendor profile with ID ${id} not found.`);
    }
    if (currentProfile.vendorId !== vendor.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile.');
    }

    const { categoryIds, tagIds, galleryImages: galleryImagesInput, ...profileData } = updateVendorProfileInput;
    if (categoryIds) await this.validateCategoryIds(categoryIds);
    if (tagIds) await this.validateTagIds(tagIds);

    return this.prisma.$transaction(async (tx) => {
      await tx.vendorProfile.update({
        where: { id },
        data: {
          ...profileData,
          ...(categoryIds !== undefined && {
            categories: {
              deleteMany: {},
              create: categoryIds.map(catId => ({
                category: { connect: { id: catId } },
              })),
            },
          }),
          ...(tagIds !== undefined && {
            tags: {
              deleteMany: {},
              create: tagIds.map(tagId => ({
                tag: { connect: { id: tagId } },
              })),
            },
          }),
        },
      });
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
      });
    });
  }

  async findOneByVendorId(vendorId: string): Promise<PrismaVendorProfile | null> {
    const profiles = await this.prisma.vendorProfile.findMany({
      where: { vendorId },
    });
    return profiles[0] || null;
  }

  async findOneById(id: string): Promise<PrismaVendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<PrismaVendorProfile[]> {
    return this.prisma.vendorProfile.findMany();
  }
} 