import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  balance!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const walletSchema = SchemaFactory.createForClass(Wallet);
walletSchema.index({ userId: 1 }, { unique: true });
