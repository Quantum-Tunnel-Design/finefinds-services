import { ObjectType, Field, ID } from '@nestjs/graphql';
import { BookingStatus } from '@prisma/client'; // Assuming BookingStatus is registered

@ObjectType('AdminPackageEnrollmentBasicInfo', { description: 'Basic information about a class package enrollment for admin views (e.g., under parent details).' })
export class AdminPackageEnrollmentBasicInfoDto {
  @Field(() => ID, { description: "Unique identifier of the enrollment record." })
  enrollmentId: string;

  @Field(() => ID, { description: "Identifier of the enrolled class package." })
  classPackageId: string;

  @Field({ description: "Name of the enrolled class package." })
  classPackageName: string;

  @Field(() => ID, { description: "Identifier of the vendor for this class package." })
  vendorId: string;

  @Field({ description: "Name of the vendor (business name or full name)." })
  vendorName: string; // Or business name

  @Field(() => BookingStatus, { description: "Current status of the booking (e.g., PAID, CANCELLED)." })
  bookingStatus: BookingStatus;

  @Field({ description: "Timestamp when the booking was made." })
  bookedAt: Date;
} 