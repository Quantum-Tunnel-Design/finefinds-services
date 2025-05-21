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

  @Query(() => [ClassPackageType], { name: 'myClassPackages' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyClassPackages(@CurrentUser() user: UserModel): Promise<ClassPackageType[]> {
    // Prisma's ClassPackage[] needs to be mapped or cast to ClassPackageType[]
    // For now, assuming direct compatibility or implicit mapping by NestJS GraphQL
    return this.classPackagesService.findVendorClassPackages(user.id) as any; 
  }

  @Query(() => ClassPackageType, { name: 'classPackage', nullable: true })
  @UseGuards(JwtAuthGuard) // Accessible by any authenticated user, service handles detailed logic
  async getClassPackage(
    @CurrentUser() user: UserModel, // Pass current user for potential role-based logic in service
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ClassPackageType | null> {
    const vendorId = user.role === UserRole.VENDOR ? user.id : undefined;
    // Prisma's ClassPackage needs to be mapped or cast to ClassPackageType
    return this.classPackagesService.findOneClassPackage(id, vendorId) as any;
  }

  @Mutation(() => OperationStatusDto, { name: 'deleteMyClassPackage' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async deleteMyClassPackage(
    @CurrentUser() user: UserModel,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OperationStatusDto> {
    await this.classPackagesService.deleteClassPackage(user.id, id);
    return { success: true, message: 'Class package deleted successfully.' };
  }
} 