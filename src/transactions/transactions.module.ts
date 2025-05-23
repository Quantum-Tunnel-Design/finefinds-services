import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For guards
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { TransactionsResolver } from './transactions.resolver'; // Import the new resolver
import { PaymentStatus } from '@prisma/client'; // Import PaymentStatus enum
import { registerEnumType } from '@nestjs/graphql'; // Import registerEnumType

// Register enums for GraphQL
registerEnumType(PaymentStatus, {
  name: 'PaymentStatus', // This name will be used in the GraphQL schema
  description: 'The status of a payment.',
});

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule, // Add UsersModule to imports
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsResolver], // Add TransactionsResolver to providers
})
export class TransactionsModule {} 