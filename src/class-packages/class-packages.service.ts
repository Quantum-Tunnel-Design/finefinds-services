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

    this.validateScheduleSlots(input.scheduleSlots);

    const now = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(now.getMonth() + 2);
    // Disallow time in the past for the 2 month calculation
    if (twoMonthsLater < now) { // Should not happen with setMonth logic but as a safe guard
        twoMonthsLater.setFullYear(now.getFullYear() + Math.floor((now.getMonth() + 2) / 12));
        twoMonthsLater.setMonth((now.getMonth() + 2) % 12);
    }

    input.scheduleSlots.forEach(slot => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException('Schedule slot end time must be after start time.');
      }
      if (startTime < now) {
        throw new BadRequestException('Schedule slot start time cannot be in the past.');
      }
      if (startTime > twoMonthsLater) {
        throw new BadRequestException('Schedule slot start time cannot be more than 2 months in the future.');
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
            availableSlots: slot.availableSlots,
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

    const now = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(now.getMonth() + 2);
     // Disallow time in the past for the 2 month calculation
    if (twoMonthsLater < now) { 
        twoMonthsLater.setFullYear(now.getFullYear() + Math.floor((now.getMonth() + 2) / 12));
        twoMonthsLater.setMonth((now.getMonth() + 2) % 12);
    }

    if (input.scheduleSlots) {
        // Rule: Schedule structure can only be changed if the package is DRAFT
        if (existingPackage.status !== ClassPackageStatus.DRAFT) {
            throw new ForbiddenException('Schedules can only be modified for DRAFT packages. To make changes to a published package, please create a new version or unpublish it first.');
        }
        // Rule: Cannot update schedules if there are active enrollments (existing rule)
        if (existingPackage.enrollments && existingPackage.enrollments.length > 0) {
            throw new ForbiddenException('Cannot update schedules for a class package with active enrollments.');
        }
        this.validateScheduleSlots(input.scheduleSlots);
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
                availableSlots: slot.availableSlots,
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
  }

  private validateScheduleSlots(slots: ScheduleSlotInput[]): void {
    const now = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(now.getMonth() + 2);
    if (twoMonthsLater < now) {
        twoMonthsLater.setFullYear(now.getFullYear() + Math.floor((now.getMonth() + 2) / 12));
        twoMonthsLater.setMonth((now.getMonth() + 2) % 12);
    }

    if (!slots || slots.length === 0) {
      throw new BadRequestException('At least one schedule slot is required.');
    }

    // Sort slots by start time to make overlap detection easier
    const sortedSlots = [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException(`Slot ${i + 1}: End time must be after start time.`);
      }
      if (startTime < now) {
        throw new BadRequestException(`Slot ${i + 1}: Start time cannot be in the past.`);
      }
      if (startTime > twoMonthsLater) {
        throw new BadRequestException(`Slot ${i + 1}: Start time cannot be more than 2 months in the future.`);
      }
      if (slot.availableSlots === undefined || slot.availableSlots === null || !Number.isInteger(slot.availableSlots) || slot.availableSlots <= 0) {
        throw new BadRequestException(`Slot ${i + 1}: Available slots must be a positive integer.`);
      }

      // Check for overlap with the next slot
      if (i < sortedSlots.length - 1) {
        const nextSlot = sortedSlots[i+1];
        const nextStartTime = new Date(nextSlot.startTime);
        if (endTime > nextStartTime) {
          throw new BadRequestException(
            `Slot ${i + 1} (ends at ${endTime.toISOString()}) overlaps with Slot ${i + 2} (starts at ${nextStartTime.toISOString()}).`
          );
        }
      }
    }
  }

  private async uploadImage(
    file: Express.Multer.File,
    vendorId: string,
    folder: string,
    fileNamePrefix?: string,
  ): Promise<string> {
    const timestamp = new Date().getTime();
    const originalName = file.originalname.split('.').slice(0, -1).join('.');
    const extension = file.originalname.split('.').pop();
    const fileName = `${fileNamePrefix ? fileNamePrefix + '-' : ''}${originalName}-${timestamp}.${extension}`;
    const path = `vendors/${vendorId}/${folder}/${fileName}`;
    return this.s3Service.uploadFile(file.buffer, path, file.mimetype);
  }
}