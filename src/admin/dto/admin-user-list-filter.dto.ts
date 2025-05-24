import { Field, InputType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { AgeGroup } from './age-group.enum';
import { PaginationInput } from './pagination.dto';

@InputType()
export class AdminUserListFilterDto {
  @Field(() => UserRole, { nullable: true })
  role?: UserRole;

  @Field(() => String, { nullable: true })
  searchTerm?: string;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  isEmailVerified?: boolean;

  @Field(() => AgeGroup, { nullable: true })
  ageGroup?: AgeGroup;

  @Field(() => PaginationInput, { nullable: true })
  pagination?: PaginationInput;
} 