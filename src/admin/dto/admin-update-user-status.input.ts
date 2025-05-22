import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType({ description: 'Input for updating a user\'s active or soft-deleted status by an admin.' })
export class AdminUpdateUserStatusInput {
  @Field(() => Boolean, {
    nullable: true,
    description: 'Set to true to make the user account active, false to deactivate.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Set to true to soft-delete the user, or false to restore a soft-deleted user. Does not perform a hard delete.',
  })
  @IsOptional()
  @IsBoolean()
  setDeleted?: boolean;
} 