import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ClassPackageType } from '../../class-packages/graphql-types/class-package.type';

@ObjectType()
export class SavedClassPackage {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  classPackageId: string;

  @Field(() => ClassPackageType)
  classPackage: ClassPackageType;

  @Field()
  createdAt: Date;
} 