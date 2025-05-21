import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, SavedClassPackage } from '@prisma/client';
import { SavedClassPackageDto } from './dto/saved-class-package.dto';

@Injectable()
export class SavedClassPackagesService {
  constructor(private prisma: PrismaService) {}

  async addSavedClass(parentId: string, classPackageId: string): Promise<SavedClassPackage> {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException('Parent not found or user is not a parent.');
    }

    const classPackage = await this.prisma.classPackage.findUnique({ where: { id: classPackageId } });
    if (!classPackage) {
      throw new NotFoundException(`ClassPackage with ID "${classPackageId}" not found.`);
    }

    const existingSave = await this.prisma.savedClassPackage.findUnique({
      where: { userId_classPackageId: { userId: parentId, classPackageId } },
    });

    if (existingSave) {
      throw new ConflictException('Class package already saved by this user.');
    }

    return this.prisma.savedClassPackage.create({
      data: {
        userId: parentId,
        classPackageId: classPackageId,
      },
    });
  }

  async removeSavedClass(parentId: string, classPackageId: string): Promise<void> {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
     if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException('Parent not found or user is not a parent.');
    }

    const result = await this.prisma.savedClassPackage.deleteMany({
      where: {
        userId: parentId,
        classPackageId: classPackageId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Saved class package not found for this user.');
    }
  }

  async listSavedClasses(parentId: string): Promise<SavedClassPackageDto[]> {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException('Parent not found or user is not a parent.');
    }

    const savedEntries = await this.prisma.savedClassPackage.findMany({
      where: { userId: parentId },
      include: {
        classPackage: {
          include: {
            vendor: {
              include: {
                businessProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return savedEntries.map(entry => {
      const pkg = entry.classPackage;
      const vendorUser = pkg.vendor;
      let vendorName = `${vendorUser.firstName} ${vendorUser.lastName}`;
      if (vendorUser.businessProfile?.businessName) {
        vendorName = vendorUser.businessProfile.businessName;
      }

      return {
        savedId: entry.id,
        classPackageId: pkg.id,
        classPackageName: pkg.name,
        classPackageDescription: pkg.description.substring(0, 150) + (pkg.description.length > 150 ? '...' : ''), // Snippet
        coverImageUrl: pkg.coverImageUrl,
        vendorId: vendorUser.id,
        vendorName: vendorName,
        savedAt: entry.createdAt,
      };
    });
  }
} 