import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { parseAmountToCents, centsToAmount } from 'src/common/utils/money.util';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from 'src/transactions/transaction.enums';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/schema/user.schema';
import { TransferDto } from './dto/transfer.dto';
import { Wallet, WalletDocument } from './schema/wallet.schema';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectConnection() private connection: Connection,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
  ) {}

  async createForUser(
    userId: string | Types.ObjectId,
    session?: ClientSession,
  ) {
    const [wallet] = await this.walletModel.create([{ userId, balance: 0 }], {
      session,
    });
    return wallet;
  }

  async findByUser(userId: string | Types.ObjectId, session?: ClientSession) {
    return this.walletModel.findOne({ userId }).session(session ?? null);
  }

  async getWallet(userId: string) {
    const user = await this.usersService.findOne(userId);
    const wallet = await this.findByUser(userId);
    if (!wallet) throw new NotFoundException('Wallet not found');

    return {
      walletId: wallet._id.toString(),
      balance: centsToAmount(wallet.balance),
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  async transfer(userId: string, transferDto: TransferDto) {
    const amount = parseAmountToCents(transferDto.amount);
    const sender = await this.usersService.findOne(userId);
    const receiver = await this.usersService.findOneByEmail(
      transferDto.receiver_email,
    );

    if (!receiver) throw new NotFoundException('Receiver not found');
    if (receiver._id.toString() === sender._id.toString()) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const transfer = await this.transferFundsInSession(
        sender,
        receiver,
        amount,
        transferDto.description ?? '',
        session,
      );

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async transferFundsInSession(
    sender: Pick<UserDocument, '_id' | 'email'>,
    receiver: Pick<UserDocument, '_id' | 'email'>,
    amount: number,
    description: string,
    session: ClientSession,
    category: TransactionCategory = TransactionCategory.TRANSFER,
  ) {
    const senderWalletExists = await this.walletModel
      .findOne({ userId: sender._id })
      .session(session);
    if (!senderWalletExists) throw new NotFoundException('Sender wallet not found');

    const senderWallet = await this.walletModel.findOneAndUpdate(
      { userId: sender._id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true, session },
    );
    if (!senderWallet) throw new BadRequestException('Insufficient balance');

    const receiverWallet = await this.walletModel.findOneAndUpdate(
      { userId: receiver._id },
      { $inc: { balance: amount } },
      { new: true, session },
    );
    if (!receiverWallet) throw new NotFoundException('Receiver wallet not found');

    const senderTransactionId = `tx_${randomUUID()}`;
    const receiverTransactionId = `tx_${randomUUID()}`;

    await this.transactionsService.createMany(
      [
        {
          transactionId: senderTransactionId,
          userId: sender._id,
          walletId: senderWallet._id,
          type: TransactionType.EXPENSE,
          category,
          amount,
          status: TransactionStatus.COMPLETED,
          description,
          relatedUserId: receiver._id,
        },
        {
          transactionId: receiverTransactionId,
          userId: receiver._id,
          walletId: receiverWallet._id,
          type: TransactionType.INCOME,
          category,
          amount,
          status: TransactionStatus.COMPLETED,
          description,
          relatedUserId: sender._id,
        },
      ],
      session,
    );

    return {
      transactionId: senderTransactionId,
      status: TransactionStatus.COMPLETED,
      amount: centsToAmount(amount),
      sender: { email: sender.email },
      receiver: { email: receiver.email },
      description,
      createdAt: new Date().toISOString(),
    };
  }
}
