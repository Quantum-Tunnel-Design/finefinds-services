import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Assuming this decorator exists
import { UserRole, User as UserModel } from '@prisma/client'; // Import UserModel for CurrentUser type
import { TransactionsService } from './transactions.service';
import { TransactionViewDto } from './dto/transaction-view.dto';

@Resolver(() => TransactionViewDto) // Resolve TransactionViewDto
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at the resolver level
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Query(() => [TransactionViewDto], { name: 'myTransactionHistory' }) // Define the GraphQL Query
  @Roles(UserRole.PARENT) // Restrict to PARENT role
  async getMyTransactionHistory(
    @CurrentUser() user: UserModel, // Use CurrentUser decorator to get authenticated user
  ): Promise<TransactionViewDto[]> {
    return this.transactionsService.getParentTransactionHistory(user.id);
  }

  // The generateInvoicePdf method will remain in TransactionsService and be called by the REST controller
  // as it handles file streaming which is not standard in GraphQL mutations/queries.
} 