import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { buildCsv } from 'src/common/utils/csv.util';
import { centsToAmount, formatAmount } from 'src/common/utils/money.util';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from './transaction.enums';
import { Transaction, TransactionDocument } from './schema/transaction.schema';

export type CreateTransactionInput = {
  transactionId: string;
  userId: string | Types.ObjectId;
  walletId: string | Types.ObjectId;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
  description?: string;
  relatedUserId?: string | Types.ObjectId;
  paymentReference?: string;
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createRecord(
    createTransactionDto: CreateTransactionInput,
    session?: ClientSession,
  ) {
    const [transaction] = await this.transactionModel.create(
      [createTransactionDto],
      { session },
    );
    return transaction;
  }

  async createMany(
    transactions: CreateTransactionInput[],
    session?: ClientSession,
  ) {
    return this.transactionModel.insertMany(transactions, { session });
  }

  async findHistory(userId: string, query: TransactionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter = this.buildFilter(userId, query);

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      data: transactions.map((transaction) => this.serialize(transaction)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async analytics(userId: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [summary] = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.INCOME] }, '$amount', 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.EXPENSE] },
                '$amount',
                0,
              ],
            },
          },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const topTransactions = await this.transactionModel
      .find({
        userId,
        status: TransactionStatus.COMPLETED,
        createdAt: { $gte: start, $lt: end },
      })
      .sort({ amount: -1, createdAt: -1 })
      .limit(5);

    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return {
      month,
      totalIncome: centsToAmount(summary?.totalIncome ?? 0),
      totalSpent: centsToAmount(summary?.totalSpent ?? 0),
      transactionCount: summary?.transactionCount ?? 0,
      topTransactions: topTransactions.map((transaction) =>
        this.serialize(transaction),
      ),
    };
  }

  async buildCsvExport(
    userId: string,
    query: Pick<TransactionQueryDto, 'type' | 'from' | 'to' | 'search'> = {},
  ) {
    const transactions = await this.transactionModel
      .find(this.buildFilter(userId, query))
      .sort({ createdAt: -1 });

    const rows = [
      [
        'Transaction ID',
        'Type',
        'Category',
        'Amount',
        'Status',
        'Description',
        'Date',
      ],
      ...transactions.map((transaction) => [
        transaction.transactionId,
        transaction.type,
        transaction.category,
        formatAmount(transaction.amount),
        transaction.status,
        transaction.description,
        transaction.createdAt.toISOString(),
      ]),
    ];

    return buildCsv(rows);
  }

  private buildFilter(
    userId: string,
    query: Pick<TransactionQueryDto, 'type' | 'from' | 'to' | 'search'>,
  ) {
    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (query.type) filter.type = query.type;

    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) createdAt.$gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        createdAt.$lte = toDate;
      }
      if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
        throw new BadRequestException('Invalid date range');
      }
      filter.createdAt = createdAt;
    }

    const searchTerms = (query.search ?? '')
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term && term !== 'and' && term !== '&');

    if (searchTerms.length > 0) {
      filter.$and = searchTerms.map((term) => {
        const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = { $regex: pattern, $options: 'i' };
        const conditions: Record<string, unknown>[] = [
          { transactionId: match },
          { description: match },
          { type: match },
          { category: match },
          { status: match },
        ];

        if (/^\d+(?:\.\d{1,2})?$/.test(term)) {
          conditions.push({ amount: Math.round(Number(term) * 100) });
        }

        return { $or: conditions };
      });
    }

    return filter;
  }

  serialize(transaction: TransactionDocument) {
    return {
      transactionId: transaction.transactionId,
      type: transaction.type,
      category: transaction.category,
      amount: centsToAmount(transaction.amount),
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
    };
  }
}
