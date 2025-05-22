import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ClassPackageStatus } from '@prisma/client'; // Assuming ClassPackageStatus is registered

@ObjectType('AdminClassPackageBasicInfo', { description: 'Basic information about a class package for admin views (e.g., under vendor details).' })
export class AdminClassPackageBasicInfoDto {
  @Field(() => ID, { description: "Unique identifier of the class package." })
  id: string;

  @Field({ description: "Name of the class package." })
  name: string;

  @Field(() => Float, { description: "Price per child for the class package." })
  pricePerChild: number;

  @Field(() => ClassPackageStatus, { description: "Current status of the class package (e.g., DRAFT, PUBLISHED)." })
  status: ClassPackageStatus;

  @Field({ description: "Timestamp when the class package was created." })
  createdAt: Date;

  @Field({ description: "Timestamp when the class package was last updated." })
  updatedAt: Date;
} 