import { Field, InputType, ID } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

@InputType()
export class BookingFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  classPackageId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string; // YYYY-MM-DD

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string; // YYYY-MM-DD
} 