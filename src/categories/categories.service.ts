import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Category> {
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      throw error;
    }
  }
} 