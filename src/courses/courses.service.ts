import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ListCoursesDto } from './dto/list-courses.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new course for a vendor
   */
  async createCourse(vendorId: string, dto: CreateCourseDto) {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
    });

    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create courses');
    }

    return this.prisma.course.create({
      data: {
        ...dto,
        vendorId,
      },
      include: { vendor: true },
    });
  }

  /**
   * Updates an existing course
   */
  async updateCourse(vendorId: string, courseId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: dto,
      include: { vendor: true },
    });
  }

  /**
   * Lists all published courses with optional filters
   */
  async listPublishedCourses(filters?: ListCoursesDto) {
    const where = {
      isPublished: true,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.level && { level: filters.level }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.course.findMany({
      where: { isPublished: true },
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets a course by ID
   */
  async getCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { vendor: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  /**
   * Gets all courses for a vendor
   */
  async getMyCourses(vendorId: string) {
    return this.prisma.course.findMany({
      where: { vendorId },
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Publishes a course
   */
  async publishCourse(vendorId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.vendorId !== vendorId) {
      throw new ForbiddenException('You can only publish your own courses');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
      include: { vendor: true },
    });
  }
} 