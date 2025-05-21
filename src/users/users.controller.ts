import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole, Child, Gender as PrismaGender } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateChildInput } from './dto/create-child.input';
import { UpdateChildInput } from './dto/update-child.input';
import { ChildDto } from './dto/child.dto';
import { Gender as DtoGender } from './dto/gender.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@CurrentUser() user: User) {
    return this.usersService.listUsers(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // --- Children Management for Parents ---

  @Post('me/children')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a new child to the authenticated parent's profile" })
  @ApiResponse({ status: 201, description: 'Child successfully added.', type: ChildDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can add children.' })
  async addChild(
    @CurrentUser() parent: User,
    @Body() createChildInput: CreateChildInput,
  ): Promise<ChildDto> {
    const child = await this.usersService.addChild(parent.id, createChildInput);
    return this.mapChildToDto(child);
  }

  @Get('me/children')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all children for the authenticated parent" })
  @ApiResponse({ status: 200, description: 'Children successfully retrieved.', type: [ChildDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can list their children.' })
  async listChildren(@CurrentUser() parent: User): Promise<ChildDto[]> {
    const children = await this.usersService.listChildren(parent.id);
    return children.map(this.mapChildToDto);
  }

  @Get('me/children/:childId') 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a specific child by ID for the authenticated parent" })
  @ApiResponse({ status: 200, description: 'Child successfully retrieved.', type: ChildDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can access their children.' })
  @ApiResponse({ status: 404, description: 'Child not found.' })
  async getChild(
      @CurrentUser() parent: User,
      @Param('childId') childId: string
  ): Promise<ChildDto> {
      // UsersService.updateChild already checks ownership, but an explicit findOne might be cleaner or added to service
      // For now, reusing listChildren and filtering, or create a dedicated service method getChildByIdAndParentId
      const children = await this.usersService.listChildren(parent.id);
      const child = children.find(c => c.id === childId);
      if (!child) {
          throw new NotFoundException(`Child with ID "${childId}" not found for this parent.`);
      }
      return this.mapChildToDto(child);
  }

  @Put('me/children/:childId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a child's information for the authenticated parent" })
  @ApiResponse({ status: 200, description: 'Child successfully updated.', type: ChildDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can update their children.' })
  @ApiResponse({ status: 404, description: 'Child not found.' })
  async updateChild(
    @CurrentUser() parent: User,
    @Param('childId') childId: string,
    @Body() updateChildInput: UpdateChildInput,
  ): Promise<ChildDto> {
    const child = await this.usersService.updateChild(parent.id, childId, updateChildInput);
    return this.mapChildToDto(child);
  }

  @Delete('me/children/:childId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a child's profile for the authenticated parent" })
  @ApiResponse({ status: 204, description: 'Child successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only parents can delete their children.' })
  @ApiResponse({ status: 404, description: 'Child not found.' })
  async deleteChild(
    @CurrentUser() parent: User,
    @Param('childId') childId: string,
  ): Promise<void> {
    await this.usersService.deleteChild(parent.id, childId);
  }

  // Helper to map Prisma Child to ChildDto
  private mapChildToDto(child: Child): ChildDto {
    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      gender: child.gender === PrismaGender.MALE ? DtoGender.MALE : DtoGender.FEMALE,
      dateOfBirth: child.dateOfBirth,
    };
  }
}