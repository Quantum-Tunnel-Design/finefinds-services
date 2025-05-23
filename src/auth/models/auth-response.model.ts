import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType()
export class AuthResponse {
  @Field(() => String, { nullable: true })
  idToken?: string;

  @Field(() => String, { nullable: true })
  refreshToken?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String, { nullable: true })
  message?: string;
} 