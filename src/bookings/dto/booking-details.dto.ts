import { Field, ObjectType, ID } from '@nestjs/graphql';
import { BookingStatus, PaymentType } from '@prisma/client';
import { ChildBookingDetailDto } from './child-booking-detail.dto';

@ObjectType()
export class BookingDetailsDto {
  @Field(() => ID)
  bookingId: string;

  @Field()
  parentName: string; // Concatenation of parent's first and last name

  @Field()
  parentEmail: string;

  @Field()
  parentPhoneNumber: string | null;

  @Field(() => ID)
  classPackageId: string;

  @Field()
  classPackageName: string;

  @Field(() => [ChildBookingDetailDto])
  children: ChildBookingDetailDto[];

  @Field()
  bookedDate: string; // YYYY-MM-DD (from ScheduleSlot startTime)

  @Field()
  bookedTimeSlot: string; // e.g., 10:00 AM - 12:00 PM (from ScheduleSlot startTime and endTime)

  @Field(() => BookingStatus)
  bookingStatus: BookingStatus;

  @Field(() => PaymentType)
  paymentType: PaymentType;

  @Field()
  numberOfChildrenBooked: number; // Count of children in this specific booking
} 