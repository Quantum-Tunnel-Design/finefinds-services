import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '@prisma/client'; // UserRole is already registered globally

@ObjectType('AdminUserView', { description: 'Basic view of a user for admin lists.' })
export class AdminUserViewDto {
  @Field(() => ID, { description: "Unique identifier of the user." })
  id: string;

  @Field({ description: "User's email address." })
  email: string;

  @Field({ description: "User's first name." })
  firstName: string;

  @Field({ description: "User's last name." })
  lastName: string;

  @Field(() => UserRole, { description: "Role of the user in the system." })
  role: UserRole;

  @Field({ description: "Indicates if the user account is currently active." })
  isActive: boolean;

  @Field({ nullable: true, description: 'Timestamp when the user was soft-deleted. Null if not deleted.' })
  deletedAt?: Date;

  @Field({ description: "Timestamp when the user was created." })
  createdAt: Date;

  @Field({ description: "Timestamp when the user was last updated." })
  updatedAt: Date;
} 