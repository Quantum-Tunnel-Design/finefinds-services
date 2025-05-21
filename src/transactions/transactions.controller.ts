import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { TransactionViewDto } from './dto/transaction-view.dto';
import { Response } from 'express';

@ApiTags('Parent Transactions')
@ApiBearerAuth()
@Controller('parent/transactions') // Changed to match common parent routes like parent/saved-classes
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT) // Ensure only PARENT role can access
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get logged-in parent\'s transaction history' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved transaction history.', type: [TransactionViewDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getMyTransactionHistory(@Req() req): Promise<TransactionViewDto[]> {
    return this.transactionsService.getParentTransactionHistory(req.user.id);
  }

  @Get('me/:paymentId/invoice')
  @ApiOperation({ summary: 'Download invoice PDF for a specific transaction' })
  @ApiParam({ name: 'paymentId', description: 'The ID of the payment transaction' })
  @ApiResponse({ status: 200, description: 'Successfully downloaded invoice PDF.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async downloadInvoice(
    @Req() req,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    return this.transactionsService.generateInvoicePdf(req.user.id, paymentId, res);
  }
} 