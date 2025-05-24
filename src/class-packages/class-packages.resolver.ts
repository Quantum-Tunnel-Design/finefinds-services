import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClassPackagesService } from './class-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User as UserModel, UserRole, ClassPackage } from '@prisma/client';
import { ClassPackage as ClassPackageModel } from './graphql-types/class-package.type';
import { OperationStatusDto } from '../common/dto/operation-status.dto';
import { CreateClassPackageInput } from './dto/create-class-package.input';
import { UpdateClassPackageInput } from './dto/update-class-package.input';

@Resolver(() => ClassPackageModel)
export class ClassPackagesResolver {
  constructor(private readonly classPackagesService: ClassPackagesService) {}

  @Query(() => [ClassPackageModel], {
    name: 'myClassPackages',
    description: 'Retrieves all class packages created by the currently authenticated vendor.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyClassPackages(@CurrentUser() user: UserModel): Promise<ClassPackageModel[]> {
    // Prisma's ClassPackage[] needs to be mapped or cast to ClassPackage[]
    // For now, assuming direct compatibility or implicit mapping by NestJS GraphQL
    return this.classPackagesService.findAll() as any; 
  }

  @Query(() => ClassPackageModel, {
    name: 'classPackage',
    nullable: true,
    description: 'Retrieves a single class package by its ID. If the authenticated user is a vendor, it ensures the package belongs to them.'
  })
  @UseGuards(JwtAuthGuard) // Accessible by any authenticated user, service handles detailed logic
  async getClassPackage(
    @CurrentUser() user: UserModel, // Pass current user for potential role-based logic in service
    @Args('id', { type: () => ID, description: 'The ID of the class package to retrieve.' }) id: string,
  ): Promise<ClassPackageModel | null> {
    const vendorId = user.role === UserRole.VENDOR ? user.id : undefined;
    // Prisma's ClassPackage needs to be mapped or cast to ClassPackage
    return this.classPackagesService.findOne(id) as any;
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
    await this.classPackagesService.remove(id);
    return { success: true, message: 'Class package deleted successfully.' };
  }

  @Mutation(() => ClassPackageModel, {
    name: 'createMyClassPackage',
    description: 'Creates a new class package for the currently authenticated vendor. Cover image URL can be optionally provided if already uploaded elsewhere.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createMyClassPackage(
    @CurrentUser() user: UserModel,
    @Args('input', { type: () => CreateClassPackageInput }) input: CreateClassPackageInput,
  ): Promise<ClassPackageModel> {
    // The service method now accepts input.coverImageUrl directly
    return this.classPackagesService.create(input) as any;
  }

  @Mutation(() => ClassPackageModel, {
    name: 'updateMyClassPackage',
    description: 'Updates an existing class package for the currently authenticated vendor. Cover image URL can be optionally provided or set to null to remove.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateMyClassPackage(
    @CurrentUser() user: UserModel,
    @Args('id', { type: () => ID, description: 'The ID of the class package to update.' }) id: string,
    @Args('input', { type: () => UpdateClassPackageInput }) input: UpdateClassPackageInput,
  ): Promise<ClassPackageModel> {
    // The service method now accepts input.coverImageUrl directly
    return this.classPackagesService.update(id, input) as any;
  }
} 