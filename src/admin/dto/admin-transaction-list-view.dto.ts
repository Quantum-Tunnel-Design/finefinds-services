import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { PaymentStatus } from '@prisma/client'; // Assuming PaymentStatus enum is registered

@ObjectType('AdminTransactionListView', { description: 'View model for listing transactions in the admin panel.' })
export class AdminTransactionListViewDto {
  @Field(() => ID, { description: "Internal unique identifier of the payment record." })
  id: string; // Prisma Payment ID

  @Field({ nullable: true, description: "Transaction ID from the payment gateway, if available." })
  gatewayTransactionId?: string; // Actual transaction ID from payment gateway

  @Field({ description: "Date and time when the payment was recorded." })
  paymentDate: Date;

  @Field(() => ID, { description: "Identifier of the parent who made the payment." })
  parentId: string;

  @Field({ description: "Full name of the parent who made the payment." })
  parentName: string;

  @Field(() => ID, { description: "Identifier of the vendor associated with the transaction." })
  vendorId: string;

  @Field({ description: "Name of the vendor (business name or full name)." })
  vendorName: string;

  @Field(() => ID, { description: "Identifier of the class package related to this transaction." })
  classPackageId: string;

  @Field({ description: "Name of the class package." })
  classPackageName: string;

  @Field(() => Float, { description: "Amount of the transaction." })
  amount: number;

  @Field({ nullable: true, description: "Method used for the payment (e.g., card, PayPal)." })
  paymentMethod?: string;

  @Field(() => PaymentStatus, { description: "Current status of the payment (e.g., PENDING, COMPLETED, FAILED)." })
  status: PaymentStatus;
} 