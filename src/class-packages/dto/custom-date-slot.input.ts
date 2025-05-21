import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CustomDateSlotInput {
  @Field()
  @IsNotEmpty()
  @IsDate()
  date: Date;

  @Field()
  @IsNotEmpty()
  // We'll store time as string e.g., "10:00", "14:30" and combine with date later
  // For now, let's assume full DateTime for simplicity of ScheduleSlotInput compatibility
  // This might need refinement based on how GraphQL handles Time-only types or client-side pickers
  @IsDate()
  startTime: Date; // Will be combined with 'date' to form full DateTime

  @Field()
  @IsNotEmpty()
  @IsDate()
  endTime: Date; // Will be combined with 'date' to form full DateTime

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  availableSlots: number;
}

@InputType()
export class CustomDatesRecurrenceInput {
    @Field(() => [CustomDateSlotInput])
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CustomDateSlotInput)
    slots: CustomDateSlotInput[];
} 