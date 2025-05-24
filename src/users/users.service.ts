import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, Child, Gender } from '@prisma/client';
import { CreateChildInput } from './dto/create-child.input';
import { UpdateChildInput } from './dto/update-child.input';

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
      gender: Gender;
      dateOfBirth: Date;
    }[];
    secondaryPhoneNumber?: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
    termsAccepted?: boolean;
    password?: string;
  }): Promise<User> {
    // First create the user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        cognitoSub: data.cognitoSub,
        phoneNumber: data.phoneNumber,
        secondaryPhoneNumber: data.secondaryPhoneNumber,
        isEmailVerified: data.isEmailVerified,
        isActive: data.isActive,
        termsAccepted: data.termsAccepted,
        password: data.password,
      },
    });

    // Then create the parent/vendor record if needed
    if (data.role === UserRole.PARENT) {
      await this.prisma.parent.create({
        data: {
          userId: user.id,
        },
      });
    } else if (data.role === UserRole.VENDOR) {
      await this.prisma.vendor.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Finally create children if provided
    if (data.children && data.children.length > 0) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
      });

      if (!parent) {
        throw new Error('Parent record not found for user');
      }

      await Promise.all(
        data.children.map(child =>
          this.prisma.child.create({
            data: {
              firstName: child.firstName,
              lastName: child.lastName,
              gender: child.gender,
              dateOfBirth: child.dateOfBirth,
              userId: user.id,
              parentId: parent.id,
            },
          }),
        ),
      );
    }

    // Return the complete user with all relations
    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        children: true,
        parent: true,
        vendor: true,
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
    lastName: string,  // Added lastName
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
  async getCurrentUser(cognitoSubValue: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub: cognitoSubValue },
    });

    if (!user) {
      throw new NotFoundException('User not found in local database for the provided token subject.');
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

  // --- Children Management --- 

  async addChild(parentId: string, input: CreateChildInput): Promise<Child> {
    // Ensure parent exists
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID "${parentId}" not found.`);
    }

    // Validate DOB - not in the future (basic validation, can be more complex)
    if (new Date(input.dateOfBirth) > new Date()) {
        throw new ForbiddenException("Child's Date of Birth cannot be in the future.");
    }

    return this.prisma.child.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
        user: {
          connect: {
            id: parentId,
          },
        },
        parent: {
          connect: {
            id: parentId,
          },
        },
      },
    });
  }

  async listChildren(parentId: string): Promise<Child[]> {
    // Ensure parent exists
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID "${parentId}" not found.`);
    }
    return this.prisma.child.findMany({ where: { userId: parentId } });
  }

  async getChild(parentId: string, childId: string): Promise<Child | null> {
    // Ensure parent exists
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID "${parentId}" not found.`);
    }

    const child = await this.prisma.child.findUnique({
      where: { id: childId, userId: parentId }, // Ensure child belongs to the parent
    });

    if (!child) {
      // Optionally throw NotFoundException if child must exist, 
      // or return null if it's acceptable for the child not to be found.
      return null;
    }
    return child;
  }

  async updateChild(parentId: string, childId: string, input: UpdateChildInput): Promise<Child> {
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID "${parentId}" not found.`);
    }

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child || child.userId !== parentId) {
      throw new NotFoundException(`Child with ID "${childId}" not found or does not belong to this parent.`);
    }

    if (input.dateOfBirth && new Date(input.dateOfBirth) > new Date()) {
        throw new ForbiddenException("Child's Date of Birth cannot be in the future.");
    }

    return this.prisma.child.update({
      where: { id: childId }, 
      data: input,
    });
  }

  async deleteChild(parentId: string, childId: string): Promise<void> {
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID "${parentId}" not found.`);
    }

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { enrollments: true } // Check for enrollments
    });

    if (!child || child.userId !== parentId) {
      throw new NotFoundException(`Child with ID "${childId}" not found or does not belong to this parent.`);
    }

    // Basic check for enrollments. More complex logic might be needed based on business rules.
    if (child.enrollments && child.enrollments.length > 0) {
        throw new ForbiddenException (
            'Cannot delete child with active enrollments. Please manage enrollments first.'
        );
    }

    await this.prisma.child.delete({
      where: { id: childId },
    });
  }
}