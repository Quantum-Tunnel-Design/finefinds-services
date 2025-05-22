import { Field, ObjectType, ID } from '@nestjs/graphql';
import { BookingStatus, PaymentType } from '@prisma/client';
import { ChildBookingDetailDto } from './child-booking-detail.dto'; // Reusing existing DTO

// Enum registration moved to bookings.module.ts

@ObjectType()
export class ParentBookingDetailsDto {
  @Field(() => ID)
  bookingId: string; // ClassPackageEnrollment ID

  @Field()
  classPackageName: string;

  @Field(() => ID)
  classPackageId: string;

  @Field()
  vendorName: string; // BusinessProfile.businessName or User's name

  @Field(() => ID)
  vendorId: string;

  @Field(() => [ChildBookingDetailDto])
  enrolledChildren: ChildBookingDetailDto[];

  @Field()
  bookedDate: string; // Formatted: YYYY-MM-DD

  @Field()
  bookedTimeSlot: string; // Formatted: HH:MM AM/PM - HH:MM AM/PM

  @Field({ nullable: true })
  location?: string; // From BusinessProfile

  @Field(() => BookingStatus)
  bookingStatus: BookingStatus;

  @Field(() => PaymentType)
  paymentType: PaymentType;

  @Field(() => ID)
  scheduleSlotId: string; // For potential future actions like reschedule/cancel
} 