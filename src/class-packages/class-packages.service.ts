import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';
import { ClassPackage, CancellationPolicyType, ClassPackageStatus, UserRole } from '@prisma/client';
import { ScheduleSlotInput } from './dto/schedule-slot.input';
import { Prisma } from '@prisma/client';
import { SchedulingType } from './dto/scheduling-type.enum';
import { CustomDatesRecurrenceInput } from './dto/custom-date-slot.input';
import { DailyRecurrenceInput } from './dto/daily-recurrence.input';
import { WeeklyRecurrenceInput } from './dto/weekly-recurrence.input';
import { DayOfWeek } from './dto/day-of-week.enum';

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

    let generatedSlots: ScheduleSlotInput[];
    switch (input.schedulingType) {
      case SchedulingType.CUSTOM_DATES:
        if (!input.customDatesInput) throw new BadRequestException('customDatesInput is required for CUSTOM_DATES scheduling type.');
        generatedSlots = this.generateSlotsFromCustomDates(input.customDatesInput);
        break;
      case SchedulingType.DAILY:
        if (!input.dailyRecurrenceInput) throw new BadRequestException('dailyRecurrenceInput is required for DAILY scheduling type.');
        generatedSlots = this.generateSlotsFromDailyRecurrence(input.dailyRecurrenceInput);
        break;
      case SchedulingType.WEEKLY:
        if (!input.weeklyRecurrenceInput) throw new BadRequestException('weeklyRecurrenceInput is required for WEEKLY scheduling type.');
        generatedSlots = this.generateSlotsFromWeeklyRecurrence(input.weeklyRecurrenceInput);
        break;
      default:
        throw new BadRequestException('Invalid scheduling type provided.');
    }

    this.validateScheduleSlots(generatedSlots);

    const now = new Date();
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(now.getMonth() + 2);
    // Disallow time in the past for the 2 month calculation
    if (twoMonthsLater < now) { // Should not happen with setMonth logic but as a safe guard
        twoMonthsLater.setFullYear(now.getFullYear() + Math.floor((now.getMonth() + 2) / 12));
        twoMonthsLater.setMonth((now.getMonth() + 2) % 12);
    }

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
          create: generatedSlots.map(slot => ({
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

    let newScheduleSlots: ScheduleSlotInput[] | undefined = undefined;

    if (input.schedulingType) { // If a new scheduling type is explicitly set
        if (existingPackage.status !== ClassPackageStatus.DRAFT) {
            throw new ForbiddenException('Scheduling type can only be changed for DRAFT packages.');
        }
        if (existingPackage.enrollments && existingPackage.enrollments.length > 0) {
            throw new ForbiddenException('Cannot change scheduling type for a class package with active enrollments.');
        }

        switch (input.schedulingType) {
            case SchedulingType.CUSTOM_DATES:
                if (!input.customDatesInput) throw new BadRequestException('customDatesInput is required for CUSTOM_DATES scheduling type.');
                newScheduleSlots = this.generateSlotsFromCustomDates(input.customDatesInput);
                break;
            case SchedulingType.DAILY:
                if (!input.dailyRecurrenceInput) throw new BadRequestException('dailyRecurrenceInput is required for DAILY scheduling type.');
                newScheduleSlots = this.generateSlotsFromDailyRecurrence(input.dailyRecurrenceInput);
                break;
            case SchedulingType.WEEKLY:
                if (!input.weeklyRecurrenceInput) throw new BadRequestException('weeklyRecurrenceInput is required for WEEKLY scheduling type.');
                newScheduleSlots = this.generateSlotsFromWeeklyRecurrence(input.weeklyRecurrenceInput);
                break;
            default:
                throw new BadRequestException('Invalid scheduling type provided.');
        }
    } else {
        // If schedulingType is not changing, but its parameters might be (e.g. updating dailyRecurrenceInput)
        // This assumes the package already has a schedulingType set implicitly by its existing slots or a previous definition.
        // For simplicity, we regenerate based on the potentially updated DTO for the *current* (or inferred) scheduling type.
        // A more robust solution might involve storing schedulingType on ClassPackage model.
        if (input.customDatesInput) {
             if (existingPackage.status !== ClassPackageStatus.DRAFT && /* check if customDatesInput is different from current */ true) {
                throw new ForbiddenException('Schedules can only be modified for DRAFT packages or if only adding new custom dates without altering existing ones for published packages.');
            }
            newScheduleSlots = this.generateSlotsFromCustomDates(input.customDatesInput);
        }
        // Similar checks and generation for dailyRecurrenceInput and weeklyRecurrenceInput if they are provided
        else if (input.dailyRecurrenceInput) {
            if (existingPackage.status !== ClassPackageStatus.DRAFT) {
                throw new ForbiddenException('Schedules can only be modified for DRAFT packages.');
            }
            newScheduleSlots = this.generateSlotsFromDailyRecurrence(input.dailyRecurrenceInput);
        }
        else if (input.weeklyRecurrenceInput) {
             if (existingPackage.status !== ClassPackageStatus.DRAFT) {
                throw new ForbiddenException('Schedules can only be modified for DRAFT packages.');
            }
            newScheduleSlots = this.generateSlotsFromWeeklyRecurrence(input.weeklyRecurrenceInput);
        }
    }

    if (newScheduleSlots) {
        if (existingPackage.status !== ClassPackageStatus.DRAFT && (existingPackage.enrollments && existingPackage.enrollments.length > 0)) {
             throw new ForbiddenException('Cannot update schedules for a class package with active enrollments if not in DRAFT status.');
        }
        this.validateScheduleSlots(newScheduleSlots);
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

    if (newScheduleSlots) { // Changed from input.scheduleSlots
        await this.prisma.scheduleSlot.deleteMany({ where: { classPackageId } });
        updateData.scheduleSlots = {
            create: newScheduleSlots.map(slot => ({ // Changed from input.scheduleSlots
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

  private generateSlotsFromCustomDates(input: CustomDatesRecurrenceInput): ScheduleSlotInput[] {
    if (!input || !input.slots || input.slots.length === 0) {
      throw new BadRequestException('Custom dates input must contain at least one slot.');
    }
    return input.slots.map(slot => {
      // Combine date and time parts. Assuming startTime and endTime on CustomDateSlotInput are full Date objects
      // where only the time part is relevant and should be combined with the specific `date`.
      const baseDate = new Date(slot.date);
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      const finalStartTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 
                                    startTime.getHours(), startTime.getMinutes(), startTime.getSeconds());
      const finalEndTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 
                                  endTime.getHours(), endTime.getMinutes(), endTime.getSeconds());
      
      if (finalEndTime <= finalStartTime) {
        throw new BadRequestException(`For date ${baseDate.toISOString().split('T')[0]}, end time must be after start time.`);
      }

      return {
        startTime: finalStartTime,
        endTime: finalEndTime,
        availableSlots: slot.availableSlots,
      };
    });
  }

  private generateSlotsFromDailyRecurrence(input: DailyRecurrenceInput): ScheduleSlotInput[] {
    const slots: ScheduleSlotInput[] = [];
    const { recurrenceStartDate, recurrenceEndDate, slotStartTime, slotEndTime, availableSlotsPerOccurrence } = input;
    
    const sTime = new Date(slotStartTime);
    const eTime = new Date(slotEndTime);

    if (eTime.getTime() <= sTime.getTime()) {
        throw new BadRequestException('Slot end time must be after slot start time for daily recurrence.');
    }

    let currentDay = new Date(recurrenceStartDate);
    const R_END_DATE_EXCLUSIVE_MAX = new Date();
    R_END_DATE_EXCLUSIVE_MAX.setMonth(R_END_DATE_EXCLUSIVE_MAX.getMonth() + 2); // System max of 2 months for recurrence
    R_END_DATE_EXCLUSIVE_MAX.setDate(R_END_DATE_EXCLUSIVE_MAX.getDate() + 1); // Make it exclusive for the loop

    const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : R_END_DATE_EXCLUSIVE_MAX;
    // Ensure recurrenceEndDate is not beyond system max
    const finalEndDate = endDate > R_END_DATE_EXCLUSIVE_MAX ? R_END_DATE_EXCLUSIVE_MAX : endDate;

    if (finalEndDate <= currentDay) {
        throw new BadRequestException('Recurrence end date must be after start date.');
    }

    while (currentDay < finalEndDate) {
        const newStartTime = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 
                                    sTime.getHours(), sTime.getMinutes(), sTime.getSeconds());
        const newEndTime = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 
                                  eTime.getHours(), eTime.getMinutes(), eTime.getSeconds());
        slots.push({
            startTime: newStartTime,
            endTime: newEndTime,
            availableSlots: availableSlotsPerOccurrence
        });
        currentDay.setDate(currentDay.getDate() + 1);
    }
    if(slots.length === 0) {
      throw new BadRequestException('Daily recurrence settings did not generate any valid slots within the allowed date range.')
    }
    return slots;
  }

  private generateSlotsFromWeeklyRecurrence(input: WeeklyRecurrenceInput): ScheduleSlotInput[] {
    const slots: ScheduleSlotInput[] = [];
    const { recurrenceStartDate, recurrenceEndDate, daysOfWeek, slotStartTime, slotEndTime, availableSlotsPerOccurrence } = input;

    const sTime = new Date(slotStartTime);
    const eTime = new Date(slotEndTime);

    if (eTime.getTime() <= sTime.getTime()) {
        throw new BadRequestException('Slot end time must be after slot start time for weekly recurrence.');
    }
    if (!daysOfWeek || daysOfWeek.length === 0) {
        throw new BadRequestException('At least one day of the week must be selected for weekly recurrence.');
    }
    // Convert Prisma DayOfWeek enum to 0 (Sunday) - 6 (Saturday) numbers
    const targetDays = daysOfWeek.map(day => {
        switch(day) {
            case DayOfWeek.SUNDAY: return 0 as const;
            case DayOfWeek.MONDAY: return 1 as const;
            case DayOfWeek.TUESDAY: return 2 as const;
            case DayOfWeek.WEDNESDAY: return 3 as const;
            case DayOfWeek.THURSDAY: return 4 as const;
            case DayOfWeek.FRIDAY: return 5 as const;
            case DayOfWeek.SATURDAY: return 6 as const;
            default: throw new Error('Invalid day of week');
        }
    });

    let currentDay = new Date(recurrenceStartDate);
    const R_END_DATE_EXCLUSIVE_MAX = new Date();
    R_END_DATE_EXCLUSIVE_MAX.setMonth(R_END_DATE_EXCLUSIVE_MAX.getMonth() + 2); 
    R_END_DATE_EXCLUSIVE_MAX.setDate(R_END_DATE_EXCLUSIVE_MAX.getDate() + 1); 

    const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : R_END_DATE_EXCLUSIVE_MAX;
    const finalEndDate = endDate > R_END_DATE_EXCLUSIVE_MAX ? R_END_DATE_EXCLUSIVE_MAX : endDate;
    
    if (finalEndDate <= currentDay) {
        throw new BadRequestException('Recurrence end date must be after start date.');
    }

    while (currentDay < finalEndDate) {
        if (targetDays.includes(currentDay.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
            const newStartTime = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 
                                        sTime.getHours(), sTime.getMinutes(), sTime.getSeconds());
            const newEndTime = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 
                                      eTime.getHours(), eTime.getMinutes(), eTime.getSeconds());
            slots.push({
                startTime: newStartTime,
                endTime: newEndTime,
                availableSlots: availableSlotsPerOccurrence
            });
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }
    if(slots.length === 0) {
      throw new BadRequestException('Weekly recurrence settings did not generate any valid slots within the allowed date range for the selected days.')
    }
    return slots;
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