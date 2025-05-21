import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

@ObjectType()
export class TransactionViewDto {
  @ApiProperty()
  @Field(() => ID)
  id: string;

  @ApiProperty()
  @Field()
  paymentDate: Date;

  @ApiProperty()
  @Field()
  className: string;

  @ApiProperty({ nullable: true })
  @Field({ nullable: true })
  scheduleDetails?: string; // e.g., "Mon, 10:00 AM - 12:00 PM"

  @ApiProperty()
  @Field(() => Float)
  paymentAmount: number;

  @ApiProperty({ nullable: true })
  @Field({ nullable: true })
  paymentMethod?: string;

  @ApiProperty({ enum: PaymentStatus })
  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ nullable: true })
  @Field({ nullable: true })
  transactionId?: string; // Gateway transaction ID

  @ApiProperty()
  @Field(() => ID)
  classPackageId: string;

  @ApiProperty()
  @Field()
  vendorName: string;
} 