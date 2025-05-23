import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client'; // Assuming UserRole is globally available or adjust import

@ObjectType()
export class DummyUserDto {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field(() => String) // GraphQL doesn't have a direct UserRole enum unless registered
  role: UserRole;
} 