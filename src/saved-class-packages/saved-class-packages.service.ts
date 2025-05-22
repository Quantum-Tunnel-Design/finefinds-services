import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, SavedClassPackage } from '@prisma/client';

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
      include: {
        classPackage: true,
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

  async listSavedClasses(parentId: string): Promise<SavedClassPackage[]> {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException('Parent not found or user is not a parent.');
    }

    return this.prisma.savedClassPackage.findMany({
      where: { userId: parentId },
      include: {
        classPackage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
} 