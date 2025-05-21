import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class SavedClassPackageDto {
  @Field(() => ID)
  savedId: string; // ID of the SavedClassPackage entry

  @Field(() => ID)
  classPackageId: string;

  @Field()
  classPackageName: string;

  @Field()
  classPackageDescription: string; // Or a snippet

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field(() => ID)
  vendorId: string;

  @Field()
  vendorName: string; // BusinessProfile.businessName or User's name

  @Field()
  savedAt: Date;
} 