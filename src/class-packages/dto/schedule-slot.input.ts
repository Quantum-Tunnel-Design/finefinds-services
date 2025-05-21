import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsInt, Min } from 'class-validator';

@InputType()
export class ScheduleSlotInput {
  @Field()
  @IsNotEmpty()
  @IsDate()
  startTime: Date;

  @Field()
  @IsNotEmpty()
  @IsDate()
  endTime: Date;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  availableSlots: number;
} 