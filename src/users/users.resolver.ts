import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as PrismaUser } from '@prisma/client';
import { CreateChildInput, UpdateChildInput } from './dto/child.input';
import { Child } from './models/child.model';
import { OperationStatusDto } from '../common/dto/operation-status.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ID } from '@nestjs/graphql';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { description: 'Retrieves the profile of the currently authenticated user. (Alias for AuthResolver.me)' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: PrismaUser): Promise<User> {
    const prismaUser = await this.usersService.getCurrentUser(user.id);
    return prismaUser as any as User;
  }

  @Query(() => [User], { description: 'Retrieves a list of users. (Placeholder - typically admin-only and with pagination/filtering)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listUsers(@CurrentUser() user: PrismaUser): Promise<User[]> {
    const prismaUsers = await this.usersService.listUsers(user);
    return prismaUsers as any as User[];
  }

  @Mutation(() => User, { description: 'Updates the profile of the currently authenticated user. (Generic - parent-specific update is in AuthResolver)' })
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: PrismaUser,
    @Args('input', { type: () => UpdateUserDto, description: 'The data to update for the user profile.' }) dto: UpdateUserDto,
  ): Promise<User> {
    const prismaUser = await this.usersService.updateProfile(user.id, dto);
    return prismaUser as any as User;
  }

  // Child Management Mutations
  @Mutation(() => Child, {
    description: "Adds a new child to the authenticated parent's profile. Restricted to PARENT role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async addChild(
    @CurrentUser() parent: PrismaUser,
    @Args('input') input: CreateChildInput,
  ): Promise<Child> {
    return this.usersService.addChild(parent.id, input) as any as Child;
  }

  @Mutation(() => Child, {
    description: "Updates a child's information for the authenticated parent. Restricted to PARENT role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateChild(
    @CurrentUser() parent: PrismaUser,
    @Args('childId', { type: () => ID }) childId: string,
    @Args('input') input: UpdateChildInput,
  ): Promise<Child> {
    return this.usersService.updateChild(parent.id, childId, input) as any as Child;
  }

  @Mutation(() => OperationStatusDto, {
    description: "Deletes a child's profile for the authenticated parent. Restricted to PARENT role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async deleteChild(
    @CurrentUser() parent: PrismaUser,
    @Args('childId', { type: () => ID }) childId: string,
  ): Promise<OperationStatusDto> {
    await this.usersService.deleteChild(parent.id, childId);
    return { success: true, message: 'Child deleted successfully.' };
  }

  // Child Management Queries
  @Query(() => [Child], {
    description: "Retrieves all children for the authenticated parent. Restricted to PARENT role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async listChildren(@CurrentUser() parent: PrismaUser): Promise<Child[]> {
    const children = await this.usersService.listChildren(parent.id);
    return children as any as Child[];
  }

  @Query(() => Child, {
    nullable: true,
    description: "Retrieves a specific child by ID for the authenticated parent. Restricted to PARENT role."
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async getChild(
    @CurrentUser() parent: PrismaUser,
    @Args('childId', { type: () => ID }) childId: string,
  ): Promise<Child | null> {
    const child = await this.usersService.getChild(parent.id, childId);
    return child as any as Child || null;
  }
} 