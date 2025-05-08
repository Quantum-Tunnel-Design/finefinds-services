import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { CourseLevel } from '@prisma/client';

@ObjectType()
export class Course {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field(() => Float)
  price: number;

  @Field(() => CourseLevel)
  level: CourseLevel;

  @Field()
  isPublished: boolean;

  @Field(() => User)
  vendor: User;

  @Field()
  vendorId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 