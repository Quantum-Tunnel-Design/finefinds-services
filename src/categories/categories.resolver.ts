import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './models/category.model';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Mutation(() => Category, { description: 'Creates a new category. Requires ADMIN role.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createCategory(@Args('input') input: CreateCategoryInput): Promise<Category> {
    return this.categoriesService.create(input);
  }

  @Query(() => [Category], { description: 'Retrieves all categories.' })
  async findAllCategories(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Query(() => Category, { description: 'Retrieves a category by ID.' })
  async findOneCategory(@Args('id', { type: () => ID }) id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Mutation(() => Category, { description: 'Updates a category. Requires ADMIN role.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCategoryInput,
  ): Promise<Category> {
    return this.categoriesService.update(id, input);
  }

  @Mutation(() => Category, { description: 'Removes a category. Requires ADMIN role.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeCategory(@Args('id', { type: () => ID }) id: string): Promise<Category> {
    return this.categoriesService.remove(id);
  }
} 