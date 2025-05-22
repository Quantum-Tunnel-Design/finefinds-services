import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Child } from '../../users/models/child.model';
import { BusinessProfile } from '../../vendors/models/business-profile.model';
import { VendorProfile } from '../../vendors/models/vendor-profile.model';
import { AdminClassPackageBasicInfoDto } from './admin-class-package-basic-info.dto';
import { AdminPackageEnrollmentBasicInfoDto } from './admin-package-enrollment-basic-info.dto';

@ObjectType('AdminUserDetails', { description: 'Detailed view of a user for admin panel, including role-specific information.' })
export class AdminUserDetailsDto {
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

  // Parent specific fields
  @Field(() => [Child], { nullable: true, description: "Children of the user, if the user is a PARENT. Includes child's details." })
  children?: Child[];

  @Field(() => [AdminPackageEnrollmentBasicInfoDto], { nullable: true, description: 'Packages the user has enrolled in, if the user is a PARENT.' })
  enrolledPackages?: AdminPackageEnrollmentBasicInfoDto[];

  // Vendor specific fields
  @Field(() => BusinessProfile, { nullable: true, description: 'Business profile of the user, if the user is a VENDOR and has a profile.' })
  businessProfile?: BusinessProfile;

  @Field(() => VendorProfile, { nullable: true, description: 'Vendor-specific profile details, if the user is a VENDOR and has a profile.' })
  vendorProfile?: VendorProfile;

  @Field(() => [AdminClassPackageBasicInfoDto], { nullable: true, description: 'Class packages created by the user, if the user is a VENDOR.' })
  createdPackages?: AdminClassPackageBasicInfoDto[];
} 