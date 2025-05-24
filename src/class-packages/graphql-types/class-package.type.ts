import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ClassPackageStatus } from '@prisma/client';
import { registerEnumType } from '@nestjs/graphql';

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

@ObjectType()
export class ClassPackage {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field(() => String)
  status: ClassPackageStatus;

  @Field()
  vendorId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
} 