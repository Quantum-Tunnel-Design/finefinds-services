import { Field, InputType, ID } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ScheduleSlotInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string; // Optional: used for updating existing slots

  @Field()
  @IsNotEmpty()
  @IsDate()
  startTime: Date;

  @Field()
  @IsNotEmpty()
  @IsDate()
  endTime: Date;
} 