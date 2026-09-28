import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from '../transaction.enums';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: String, required: true })
  transactionId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true })
  walletId!: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({ type: String, enum: TransactionCategory, required: true })
  category!: TransactionCategory;

  @Prop({ type: Number, required: true, min: 1 })
  amount!: number;

  @Prop({
    type: String,
    enum: TransactionStatus,
    required: true,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Prop({ type: String, default: '' })
  description!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  relatedUserId?: Types.ObjectId;

  @Prop({ type: String })
  paymentReference?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const transactionSchema = SchemaFactory.createForClass(Transaction);
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
transactionSchema.index({ walletId: 1, createdAt: -1 });
