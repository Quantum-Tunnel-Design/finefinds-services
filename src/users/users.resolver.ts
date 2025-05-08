import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as PrismaUser } from '@prisma/client';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: PrismaUser): Promise<PrismaUser> {
    return this.usersService.getCurrentUser(user.id);
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async listUsers(@CurrentUser() user: PrismaUser): Promise<PrismaUser[]> {
    return this.usersService.listUsers(user);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: PrismaUser,
    @Args('input') dto: UpdateUserDto,
  ): Promise<PrismaUser> {
    return this.usersService.updateProfile(user.id, dto);
  }
} 