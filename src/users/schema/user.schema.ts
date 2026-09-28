import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, trim: true })
  username!: string;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, required: true, select: false })
  password!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' })
  walletId!: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
userSchema.index({ email: 1 }, { unique: true });
