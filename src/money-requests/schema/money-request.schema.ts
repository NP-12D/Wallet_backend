import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { MoneyRequestStatus } from '../money-request.enums';

export type MoneyRequestDocument = HydratedDocument<MoneyRequest>;

@Schema({ timestamps: true })
export class MoneyRequest {
  @Prop({ type: String, required: true, unique: true })
  requestId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  requesterId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipientId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  amount!: number;

  @Prop({ type: String, default: '', maxlength: 200 })
  description!: string;

  @Prop({
    type: String,
    enum: MoneyRequestStatus,
    required: true,
    default: MoneyRequestStatus.PENDING,
  })
  status!: MoneyRequestStatus;

  @Prop({ type: Date })
  respondedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const moneyRequestSchema = SchemaFactory.createForClass(MoneyRequest);
moneyRequestSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
moneyRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
