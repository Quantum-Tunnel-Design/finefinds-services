import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { ClassPackageStatus, CancellationPolicyType, UserRole } from '@prisma/client';
import { User } from '../../users/models/user.model';

// --- Placeholder for UserType ---
// @ObjectType('User') 
// export class UserType {
//   @Field(() => ID)
//   id: string;
//   @Field({nullable: true})
//   firstName?: string;
//   @Field({nullable: true})
//   lastName?: string;
//   @Field({nullable: true})
//   email?: string;
//   @Field(() => UserRole, {nullable: true}) 
//   role?: UserRole;
// }
// --- End Placeholder for UserType ---

// --- Placeholder for CategoryType ---
@ObjectType('Category')
export class CategoryType {
  @Field(() => ID)
  id: string;
  @Field({ nullable: true })
  name?: string;
}
// --- End Placeholder for CategoryType ---

// --- Placeholder for AgeGroupType ---
@ObjectType('AgeGroup')
export class AgeGroupType {
  @Field(() => ID)
  id: string;
  @Field({ nullable: true })
  name?: string;
}
// --- End Placeholder for AgeGroupType ---

// --- Placeholder for ScheduleSlotType ---
@ObjectType('ScheduleSlot')
export class ScheduleSlotType {
  @Field(() => ID)
  id: string;
  @Field()
  startTime: Date;
  @Field()
  endTime: Date;
  @Field(() => Float) 
  availableSlots: number;
}
// --- End Placeholder for ScheduleSlotType ---

registerEnumType(ClassPackageStatus, { name: 'ClassPackageStatus' });
registerEnumType(CancellationPolicyType, { name: 'CancellationPolicyType' });
// UserRole is expected to be registered elsewhere (e.g., UserModule or globally)
// If not, it should be registered: registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType('ClassPackage')
export class ClassPackageType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  beforeYouComeInstructions?: string;

  @Field(() => Float)
  pricePerChild: number;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field(() => ClassPackageStatus)
  status: ClassPackageStatus;

  @Field(() => CancellationPolicyType)
  cancellationPolicyType: CancellationPolicyType;

  @Field(() => Float, { nullable: true })
  rescheduleDaysBefore?: number;

  @Field(() => User)
  vendor: User; 

  @Field(() => ID)
  vendorId: string;

  @Field(() => CategoryType) 
  category: CategoryType; 

  @Field(() => ID)
  categoryId: string;

  @Field(() => [AgeGroupType]) 
  ageGroups: AgeGroupType[]; 

  @Field(() => [String], { nullable: 'itemsAndList' })
  tags?: string[];

  @Field(() => [ScheduleSlotType], { nullable: 'itemsAndList' })
  scheduleSlots?: ScheduleSlotType[]; 

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // enrollments: ClassPackageEnrollment[] - Decide if needed for these queries
  // savedByUsers: SavedClassPackage[] - Decide if needed
} 