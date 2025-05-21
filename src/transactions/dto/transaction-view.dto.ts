import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class TransactionViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentDate: Date;

  @ApiProperty()
  className: string;

  @ApiProperty({ nullable: true })
  scheduleDetails?: string; // e.g., "Mon, 10:00 AM - 12:00 PM"

  @ApiProperty()
  paymentAmount: number;

  @ApiProperty({ nullable: true })
  paymentMethod?: string;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ nullable: true })
  transactionId?: string; // Gateway transaction ID

  @ApiProperty()
  classPackageId: string;

  @ApiProperty()
  vendorName: string;
} 