import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';
import { ClassPackage, CancellationPolicyType, ClassPackageStatus, UserRole } from '@prisma/client';
import { ScheduleSlotInput } from './dto/schedule-slot.input';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassPackagesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private auditService: AuditService,
  ) {}

  async createClassPackage(
    vendorId: string,
    input: CreateClassPackageInput,
    coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    if (
      input.cancellationPolicyType === CancellationPolicyType.FLEXIBLE_RESCHEDULING &&
      (input.rescheduleDaysBefore === null || input.rescheduleDaysBefore === undefined || input.rescheduleDaysBefore < 0)
    ) {
      throw new BadRequestException(
        'rescheduleDaysBefore is required and must be a non-negative number for FLEXIBLE_RESCHEDULING policy.',
      );
    }
    if (
      input.cancellationPolicyType === CancellationPolicyType.FIXED_COMMITMENT &&
      input.rescheduleDaysBefore !== null && input.rescheduleDaysBefore !== undefined
    ) {
        input.rescheduleDaysBefore = null; 
    }

    input.scheduleSlots.forEach(slot => {
      if (new Date(slot.endTime) <= new Date(slot.startTime)) {
        throw new BadRequestException('Schedule slot end time must be after start time.');
      }
    });

    let coverImageUrl: string | null = null;
    if (coverImageFile) {
      this.validateImage(coverImageFile, 'cover image');
      coverImageUrl = await this.uploadImage(coverImageFile, vendorId, 'class-package-cover');
    }

    const createdClassPackage = await this.prisma.classPackage.create({
      data: {
        vendor: { connect: { id: vendorId } },
        name: input.name,
        description: input.description,
        beforeYouComeInstructions: input.beforeYouComeInstructions,
        pricePerChild: input.pricePerChild,
        coverImageUrl,
        status: input.status || ClassPackageStatus.DRAFT,
        cancellationPolicyType: input.cancellationPolicyType,
        rescheduleDaysBefore: input.rescheduleDaysBefore,
        category: { connect: { id: input.categoryId } },
        ageGroups: { connect: input.ageGroupIds.map(id => ({ id })) },
        tags: input.tags,
        scheduleSlots: {
          create: input.scheduleSlots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        },
      },
      include: { category: true, ageGroups: true, scheduleSlots: true },
    });

    return createdClassPackage;
  }

  async updateClassPackage(
    vendorId: string,
    classPackageId: string,
    input: UpdateClassPackageInput,
    coverImageFile?: Express.Multer.File,
  ): Promise<ClassPackage> {
    const existingPackage = await this.prisma.classPackage.findUnique({
      where: { id: classPackageId },
      include: { vendor: true, scheduleSlots: true, category: true, ageGroups: true, enrollments: true },
    });

    if (!existingPackage) {
      throw new NotFoundException(`ClassPackage with ID "${classPackageId}" not found`);
    }

    if (existingPackage.vendorId !== vendorId) {
      throw new ForbiddenException('You are not authorized to update this class package.');
    }

    const currentPolicy = input.cancellationPolicyType || existingPackage.cancellationPolicyType;
    let rescheduleDays = input.rescheduleDaysBefore !== undefined ? input.rescheduleDaysBefore : existingPackage.rescheduleDaysBefore;

    if (
      currentPolicy === CancellationPolicyType.FLEXIBLE_RESCHEDULING &&
      (rescheduleDays === null || rescheduleDays === undefined || rescheduleDays < 0)
    ) {
      throw new BadRequestException(
        'rescheduleDaysBefore is required and must be a non-negative number for FLEXIBLE_RESCHEDULING policy.',
      );
    }
     if (currentPolicy === CancellationPolicyType.FIXED_COMMITMENT) {
        rescheduleDays = null; 
    }

    if (input.scheduleSlots) {
        if (existingPackage.enrollments && existingPackage.enrollments.length > 0) {
            throw new ForbiddenException('Cannot update schedules for a class package with active enrollments.');
        }
        input.scheduleSlots.forEach(slot => {
            if (new Date(slot.endTime) <= new Date(slot.startTime)) {
                throw new BadRequestException('Schedule slot end time must be after start time.');
            }
        });
    }

    let coverImageUrl: string | undefined | null = existingPackage.coverImageUrl;
    if (coverImageFile) {
      this.validateImage(coverImageFile, 'cover image');
      coverImageUrl = await this.uploadImage(coverImageFile, vendorId, 'class-package-cover', existingPackage.id);
    }

    const updateData: Prisma.ClassPackageUpdateInput = {
      name: input.name,
      description: input.description,
      beforeYouComeInstructions: input.beforeYouComeInstructions,
      pricePerChild: input.pricePerChild,
      status: input.status,
      cancellationPolicyType: input.cancellationPolicyType,
      rescheduleDaysBefore: rescheduleDays,
      tags: input.tags,
    };

    if (coverImageUrl !== undefined) {
        updateData.coverImageUrl = coverImageUrl;
    }
    if (input.categoryId) {
      updateData.category = { connect: { id: input.categoryId } };
    }
    if (input.ageGroupIds) {
      updateData.ageGroups = { set: input.ageGroupIds.map(id => ({ id })) };
    }

    if (input.scheduleSlots) {
        await this.prisma.scheduleSlot.deleteMany({ where: { classPackageId } });
        updateData.scheduleSlots = {
            create: input.scheduleSlots.map(slot => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
            })),
        };
    }
    
    const cleanedUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});

    const updatedClassPackage = await this.prisma.classPackage.update({
      where: { id: classPackageId },
      data: cleanedUpdateData,
      include: { category: true, ageGroups: true, scheduleSlots: true },
    });

    return updatedClassPackage;
  }

  async findVendorClassPackages(vendorId: string): Promise<ClassPackage[]> {
    return this.prisma.classPackage.findMany({
        where: { vendorId },
        include: { category: true, ageGroups: true, scheduleSlots: true },
        orderBy: { updatedAt: 'desc'}
    });
  }

  async findOneClassPackage(id: string, vendorId?: string): Promise<ClassPackage> {
    const classPackage = await this.prisma.classPackage.findUnique({
        where: { id },
        include: { category: true, ageGroups: true, scheduleSlots: true, vendor: true },
    });

    if (!classPackage) {
        throw new NotFoundException(`ClassPackage with ID "${id}" not found`);
    }

    if (vendorId && classPackage.vendorId !== vendorId) {
        throw new ForbiddenException('You are not authorized to view this class package.');
    }

    return classPackage;
  }

  async deleteClassPackage(vendorId: string, classPackageId: string): Promise<{ message: string }> {
    const classPackage = await this.prisma.classPackage.findUnique({
      where: { id: classPackageId },
      include: { vendor: true, enrollments: true },
    });

    if (!classPackage) {
      throw new NotFoundException(`ClassPackage with ID "${classPackageId}" not found`);
    }

    if (classPackage.vendorId !== vendorId) {
      throw new ForbiddenException('You are not authorized to delete this class package.');
    }

    if (classPackage.enrollments && classPackage.enrollments.length > 0) {
      throw new ForbiddenException('Cannot delete class package with active enrollments. Please contact support if you need to archive it.');
    }

    await this.prisma.scheduleSlot.deleteMany({ where: { classPackageId } });
    await this.prisma.classPackage.delete({ where: { id: classPackageId } });
    
    return { message: 'Class package deleted successfully' };
  }

  private validateImage(file: Express.Multer.File, type: string): void {
    if (file.size > 5 * 1024 * 1024) { 
      throw new BadRequestException(`${type} size must not exceed 5MB.`);
    }
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`${type} must be a valid image format (JPG, PNG).`);
    }
  }

  private async uploadImage(file: Express.Multer.File, vendorId: string, type: string, packageId?: string ): Promise<string> {
    const key = `vendors/${vendorId}/class-packages/${packageId || 'new'}/${type}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    return this.s3Service.uploadFile(file.buffer, key, file.mimetype);
  }
} 