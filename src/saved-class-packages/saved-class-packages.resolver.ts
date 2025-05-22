import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SavedClassPackagesService } from './saved-class-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SavedClassPackage } from './models/saved-class-package.model';
import { OperationStatusDto } from '../common/dto/operation-status.dto';

@Resolver(() => SavedClassPackage)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class SavedClassPackagesResolver {
  constructor(private readonly savedClassPackagesService: SavedClassPackagesService) {}

  @Mutation(() => SavedClassPackage, {
    description: "Save a class package to the parent's favorites"
  })
  async addSavedClass(
    @CurrentUser() parent: User,
    @Args('classPackageId', { type: () => ID, description: 'The ID of the class package to save.' }) classPackageId: string,
  ): Promise<SavedClassPackage> {
    return this.savedClassPackagesService.addSavedClass(parent.id, classPackageId) as any as SavedClassPackage;
  }

  @Mutation(() => OperationStatusDto, {
    description: "Remove a class package from the parent's favorites"
  })
  async removeSavedClass(
    @CurrentUser() parent: User,
    @Args('classPackageId', { type: () => ID, description: 'The ID of the class package to remove.' }) classPackageId: string,
  ): Promise<OperationStatusDto> {
    await this.savedClassPackagesService.removeSavedClass(parent.id, classPackageId);
    return { success: true, message: 'Class package removed from favorites successfully.' };
  }

  @Query(() => [SavedClassPackage], {
    description: 'List all saved class packages for the parent'
  })
  async listSavedClasses(
    @CurrentUser() parent: User,
  ): Promise<SavedClassPackage[]> {
    return this.savedClassPackagesService.listSavedClasses(parent.id) as any as SavedClassPackage[];
  }
} 