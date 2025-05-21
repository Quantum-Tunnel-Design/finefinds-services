import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByCognitoId(cognitoSub: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { cognitoSub },
    });
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    cognitoSub: string;
    phoneNumber?: string;
    children?: {
      firstName: string;
      lastName: string;
      gender: 'male' | 'female';
      dateOfBirth: Date;
    }[];
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        cognitoSub: data.cognitoSub,
        phoneNumber: data.phoneNumber,
        children: data.children ? {
          create: data.children.map(child => ({
            firstName: child.firstName,
            lastName: child.lastName,
            gender: child.gender,
            dateOfBirth: child.dateOfBirth,
          }))
        } : undefined,
      },
      include: {
        children: true,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async delete(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  /**
   * Creates or updates a user from Cognito authentication
   */
  async createOrUpdateFromCognito(
    cognitoSub: string,
    email: string,
    firstName: string, // Changed from name
    lastName: string,  // Added lastName parameter
    role: UserRole,
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { cognitoSub },
      update: {
        email,
        firstName,  // Changed from name
        lastName,   // Added lastName
        role,
      },
      create: {
        cognitoSub,
        email,
        firstName,  // Changed from name
        lastName,   // Added lastName
        role,
      },
    });
  }

  /**
   * Updates a user's profile information
   */
  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  /**
   * Gets the current user's profile
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Lists all users (admin only)
   */
  async listUsers(currentUser: User): Promise<User[]> {
    if (currentUser.role !== UserRole.ADMIN) { // Changed from VENDOR to ADMIN (seems more logical)
      throw new ForbiddenException('Only admins can list all users');
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}