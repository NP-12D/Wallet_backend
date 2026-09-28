import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Connection, Model } from 'mongoose';
import { centsToAmount, parseAmountToCents } from 'src/common/utils/money.util';
import {
  Transaction,
  TransactionDocument,
} from 'src/transactions/schema/transaction.schema';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from 'src/transactions/transaction.enums';
import { Wallet, WalletDocument } from 'src/wallets/schema/wallet.schema';
import { WalletsService } from 'src/wallets/wallets.service';
import { CheckoutDto } from './dto/checkout.dto';
import { WebhookDto, WebhookStatus } from './dto/webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectConnection() private connection: Connection,
    private walletsService: WalletsService,
  ) {}

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const amount = parseAmountToCents(checkoutDto.amount);
    const wallet = await this.walletsService.findByUser(userId);
    if (!wallet) throw new NotFoundException('Wallet not found');

    const transaction = await this.transactionModel.create({
      transactionId: `tx_${randomUUID()}`,
      userId,
      walletId: wallet._id,
      type: TransactionType.INCOME,
      category: TransactionCategory.TOP_UP,
      amount,
      status: TransactionStatus.PENDING,
      description: 'Wallet top-up checkout',
      paymentReference: `checkout_${randomUUID()}`,
    });

    return {
      transaction_id: transaction.transactionId,
      amount: centsToAmount(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
    };
  }

  async webhook(webhookDto: WebhookDto) {
    const mappedStatus = this.mapWebhookStatus(webhookDto.status);
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const transaction = await this.transactionModel
        .findOne({ transactionId: webhookDto.transaction_id })
        .session(session);

      if (!transaction) throw new NotFoundException('Invalid transaction ID');

      if (
        transaction.category !== TransactionCategory.TOP_UP ||
        transaction.type !== TransactionType.INCOME ||
        !transaction.paymentReference
      ) {
        throw new BadRequestException(
          'Only pending top-up payments can be confirmed by transaction ID',
        );
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(
          `Payment has already been resolved as ${transaction.status}`,
        );
      }

      const updatedTransaction = await this.transactionModel.findOneAndUpdate(
        {
          transactionId: webhookDto.transaction_id,
          status: TransactionStatus.PENDING,
        },
        { status: mappedStatus },
        { new: true, session },
      );

      if (!updatedTransaction) {
        throw new BadRequestException(
          'Payment could not be confirmed because it is no longer pending',
        );
      }

      if (mappedStatus === TransactionStatus.COMPLETED) {
        await this.walletModel.updateOne(
          { _id: updatedTransaction.walletId },
          { $inc: { balance: updatedTransaction.amount } },
          { session },
        );
      }

      await session.commitTransaction();
      return this.webhookResponse(updatedTransaction);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private mapWebhookStatus(status: WebhookStatus) {
    if (status === WebhookStatus.SUCCESS) return TransactionStatus.COMPLETED;
    if (status === WebhookStatus.FAILED) return TransactionStatus.FAILED;
    throw new BadRequestException('Invalid webhook status');
  }

  private webhookResponse(transaction: TransactionDocument) {
    return {
      transaction_id: transaction.transactionId,
      amount: centsToAmount(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
    };
  }
}
