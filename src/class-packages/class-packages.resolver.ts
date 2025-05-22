import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClassPackagesService } from './class-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User as UserModel, UserRole } from '@prisma/client';
import { ClassPackageType } from './graphql-types/class-package.type';
import { OperationStatusDto } from '../common/dto/operation-status.dto';

@Resolver(() => ClassPackageType)
export class ClassPackagesResolver {
  constructor(private readonly classPackagesService: ClassPackagesService) {}

  @Query(() => [ClassPackageType], {
    name: 'myClassPackages',
    description: 'Retrieves all class packages created by the currently authenticated vendor.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyClassPackages(@CurrentUser() user: UserModel): Promise<ClassPackageType[]> {
    // Prisma's ClassPackage[] needs to be mapped or cast to ClassPackageType[]
    // For now, assuming direct compatibility or implicit mapping by NestJS GraphQL
    return this.classPackagesService.findVendorClassPackages(user.id) as any; 
  }

  @Query(() => ClassPackageType, {
    name: 'classPackage',
    nullable: true,
    description: 'Retrieves a single class package by its ID. If the authenticated user is a vendor, it ensures the package belongs to them.'
  })
  @UseGuards(JwtAuthGuard) // Accessible by any authenticated user, service handles detailed logic
  async getClassPackage(
    @CurrentUser() user: UserModel, // Pass current user for potential role-based logic in service
    @Args('id', { type: () => ID, description: 'The ID of the class package to retrieve.' }) id: string,
  ): Promise<ClassPackageType | null> {
    const vendorId = user.role === UserRole.VENDOR ? user.id : undefined;
    // Prisma's ClassPackage needs to be mapped or cast to ClassPackageType
    return this.classPackagesService.findOneClassPackage(id, vendorId) as any;
  }

  @Mutation(() => OperationStatusDto, {
    name: 'deleteMyClassPackage',
    description: 'Deletes a class package owned by the currently authenticated vendor. This operation cannot be undone.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async deleteMyClassPackage(
    @CurrentUser() user: UserModel,
    @Args('id', { type: () => ID, description: 'The ID of the class package to delete.' }) id: string,
  ): Promise<OperationStatusDto> {
    await this.classPackagesService.deleteClassPackage(user.id, id);
    return { success: true, message: 'Class package deleted successfully.' };
  }
} 