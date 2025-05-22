import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { Response } from 'express';

@ApiTags('Parent Transactions (REST)')
@ApiBearerAuth()
@Controller('parent/transactions') // Changed to match common parent routes like parent/saved-classes
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT) // Ensure only PARENT role can access
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me/:paymentId/invoice')
  @ApiOperation({ summary: 'Download invoice PDF for a specific transaction (Parent Only)', description: 'Allows a parent to download a PDF invoice for one of their transactions.' })
  @ApiParam({ name: 'paymentId', description: 'The ID of the payment transaction.', example: 'pay_123xyzabc', type: String })
  @ApiResponse({ status: 200, description: 'Successfully downloaded invoice PDF. The response will be a PDF file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. User is not logged in.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not a PARENT or does not own the transaction.' })
  @ApiResponse({ status: 404, description: 'Transaction not found or invoice not available.' })
  async downloadInvoice(
    @Req() req,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    return this.transactionsService.generateInvoicePdf(req.user.id, paymentId, res);
  }
} 