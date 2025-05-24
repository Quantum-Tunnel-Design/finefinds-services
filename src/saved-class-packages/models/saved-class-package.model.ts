import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ClassPackage } from '../../class-packages/graphql-types/class-package.type';

@ObjectType()
export class SavedClassPackage {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  classPackageId: string;

  @Field(() => ClassPackage)
  classPackage: ClassPackage;

  @Field()
  createdAt: Date;
} 