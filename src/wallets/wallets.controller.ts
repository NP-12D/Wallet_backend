import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ExportQueryDto } from 'src/transactions/dto/export-query.dto';
import { TransactionQueryDto } from 'src/transactions/dto/transaction-query.dto';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { ConfirmTransferDto } from 'src/email-codes/dto/confirm-transfer.dto';
import { WalletsService } from './wallets.service';

@Controller('wallet')
@ApiTags('wallet')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user wallet' })
  getWallet(@User() userId: string) {
    return this.walletsService.getWallet(userId);
  }

  @Post('/transfer')
  @ApiOperation({ summary: 'Transfer money to another wallet user' })
  transfer(@User() userId: string, @Body() body: TransferDto) {
    return this.walletsService.requestTransferVerification(userId, body);
  }

  @Post('/transfer/confirm')
  @ApiOperation({ summary: 'Confirm a transfer with the emailed code' })
  confirmTransfer(@User() userId: string, @Body() body: ConfirmTransferDto) {
    return this.walletsService.confirmTransfer(userId, body.code);
  }

  @Get('/transactions/export')
  @ApiOperation({ summary: 'Export authenticated user transactions as CSV' })
  async exportTransactions(
    @User() userId: string,
    @Query() query: ExportQueryDto,
    @Res() response: Response,
  ) {
    const csv = await this.transactionsService.buildCsvExport(userId, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="wallet-transactions.csv"',
    );
    return response.send(csv);
  }

  @Get('/transactions')
  @ApiOperation({ summary: 'Get paginated authenticated user transactions' })
  getTransactions(@User() userId: string, @Query() query: TransactionQueryDto) {
    return this.transactionsService.findHistory(userId, query);
  }

  @Get('/analytics')
  @ApiOperation({ summary: 'Get current month wallet analytics' })
  analytics(@User() userId: string) {
    return this.transactionsService.analytics(userId);
  }
}
