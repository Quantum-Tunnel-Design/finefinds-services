import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';
import { ClassPackageStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassPackagesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createClassPackageInput: CreateClassPackageInput) {
    const data: Prisma.ClassPackageCreateInput = {
      title: createClassPackageInput.title,
      description: createClassPackageInput.description,
      price: createClassPackageInput.price,
      vendor: {
        connect: {
          id: createClassPackageInput.vendorId,
        },
      },
      status: createClassPackageInput.status || ClassPackageStatus.DRAFT,
    };

    return this.prisma.classPackage.create({
      data,
      include: {
        vendor: true,
        enrollments: true,
      },
    });
  }

  async findAll() {
    return this.prisma.classPackage.findMany({
      include: {
        vendor: true,
        enrollments: true,
      },
    });
  }

  async findOne(id: string) {
    const classPackage = await this.prisma.classPackage.findUnique({
      where: { id },
      include: {
        vendor: true,
        enrollments: true,
      },
    });

    if (!classPackage) {
      throw new NotFoundException(`Class package with ID ${id} not found`);
    }

    return classPackage;
  }

  async update(id: string, updateClassPackageInput: UpdateClassPackageInput) {
    const classPackage = await this.findOne(id);

    if (classPackage.status === ClassPackageStatus.PUBLISHED) {
      throw new BadRequestException('Cannot update a published class package');
    }

    const data: Prisma.ClassPackageUpdateInput = {
      title: updateClassPackageInput.title,
      description: updateClassPackageInput.description,
      price: updateClassPackageInput.price,
      status: updateClassPackageInput.status,
    };

    return this.prisma.classPackage.update({
      where: { id },
      data,
      include: {
        vendor: true,
        enrollments: true,
      },
    });
  }

  async remove(id: string) {
    const classPackage = await this.findOne(id);

    // Check if there are any enrollments
    const enrollments = await this.prisma.classPackageEnrollment.findMany({
      where: { classPackageId: id },
    });

    if (enrollments.length > 0) {
      throw new BadRequestException('Cannot delete a class package with existing enrollments');
    }

    return this.prisma.classPackage.delete({
      where: { id },
    });
  }
}