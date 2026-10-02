import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Connection, Model, Types } from 'mongoose';
import { centsToAmount, parseAmountToCents } from 'src/common/utils/money.util';
import { UserDocument } from 'src/users/schema/user.schema';
import { UsersService } from 'src/users/users.service';
import { WalletsService } from 'src/wallets/wallets.service';
import { TransactionCategory } from 'src/transactions/transaction.enums';
import { CreateMoneyRequestDto } from './dto/create-money-request.dto';
import { MoneyRequestStatus } from './money-request.enums';
import { MoneyRequest, MoneyRequestDocument } from './schema/money-request.schema';

type RequestUser = Pick<UserDocument, '_id' | 'username' | 'email'>;

@Injectable()
export class MoneyRequestsService {
  constructor(
    @InjectModel(MoneyRequest.name)
    private moneyRequestModel: Model<MoneyRequestDocument>,
    @InjectConnection() private connection: Connection,
    private usersService: UsersService,
    private walletsService: WalletsService,
  ) {}

  async create(userId: string, dto: CreateMoneyRequestDto) {
    const requester = await this.usersService.findOne(userId);
    const recipient = await this.usersService.findOneByEmail(dto.recipient_email);

    if (!recipient) throw new NotFoundException('Recipient not found');
    if (recipient._id.toString() === requester._id.toString()) {
      throw new BadRequestException('Cannot request money from yourself');
    }

    const request = await this.moneyRequestModel.create({
      requestId: `mr_${randomUUID()}`,
      requesterId: requester._id,
      recipientId: recipient._id,
      amount: parseAmountToCents(dto.amount),
      description: dto.description?.trim() ?? '',
    });

    return this.serialize(request, requester, recipient);
  }

  async list(userId: string) {
    const user = await this.usersService.findOne(userId);
    const requests = await this.moneyRequestModel
      .find({ $or: [{ requesterId: user._id }, { recipientId: user._id }] })
      .populate('requesterId', 'username email')
      .populate('recipientId', 'username email')
      .sort({ createdAt: -1 });

    return requests.map((request) =>
      this.serialize(
        request,
        request.requesterId as unknown as RequestUser,
        request.recipientId as unknown as RequestUser,
      ),
    );
  }

  async getPendingIncomingCount(userId: string) {
    const user = await this.usersService.findOne(userId);
    const count = await this.moneyRequestModel.countDocuments({
      recipientId: user._id,
      status: MoneyRequestStatus.PENDING,
    });

    return { count };
  }

  async fulfill(userId: string, requestId: string) {
    const recipient = await this.usersService.findOne(userId);
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const request = await this.moneyRequestModel
        .findOneAndUpdate(
          {
            requestId,
            recipientId: recipient._id,
            status: MoneyRequestStatus.PENDING,
          },
          { $set: { status: MoneyRequestStatus.FULFILLED, respondedAt: new Date() } },
          { new: true, session },
        )
        .populate('requesterId', 'username email');

      if (!request) {
        throw new NotFoundException('Pending money request not found');
      }

      const requester = request.requesterId as unknown as RequestUser;
      const transfer = await this.walletsService.transferFundsInSession(
        recipient,
        requester,
        request.amount,
        request.description || 'Money request',
        session,
        TransactionCategory.MONEY_REQUEST,
      );

      await session.commitTransaction();
      return {
        ...this.serialize(request, requester, recipient),
        transfer,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async decline(userId: string, requestId: string) {
    const recipient = await this.usersService.findOne(userId);
    const request = await this.moneyRequestModel
      .findOneAndUpdate(
        {
          requestId,
          recipientId: recipient._id,
          status: MoneyRequestStatus.PENDING,
        },
        { $set: { status: MoneyRequestStatus.DECLINED, respondedAt: new Date() } },
        { new: true },
      )
      .populate('requesterId', 'username email');

    if (!request) throw new NotFoundException('Pending money request not found');
    return this.serialize(
      request,
      request.requesterId as unknown as RequestUser,
      recipient,
    );
  }

  private serialize(
    request: MoneyRequestDocument,
    requester: RequestUser,
    recipient: RequestUser,
  ) {
    return {
      requestId: request.requestId,
      amount: centsToAmount(request.amount),
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
      requester: {
        id: requester._id.toString(),
        username: requester.username,
        email: requester.email,
      },
      recipient: {
        id: recipient._id.toString(),
        username: recipient.username,
        email: recipient.email,
      },
    };
  }
}
