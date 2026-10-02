import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { EmailCodePurpose } from '../email-code.enums';

export type EmailCodeDocument = HydratedDocument<EmailCode>;

@Schema({ timestamps: true })
export class EmailCode {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: EmailCodePurpose, required: true })
  purpose!: EmailCodePurpose;

  @Prop({ type: String, required: true })
  codeHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date })
  consumedAt?: Date;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: String, lowercase: true, trim: true })
  receiverEmail?: string;

  @Prop({ type: Number, min: 1 })
  amount?: number;

  @Prop({ type: String, maxlength: 200 })
  description?: string;

  createdAt!: Date;
}

export const emailCodeSchema = SchemaFactory.createForClass(EmailCode);
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailCodeSchema.index({ userId: 1, purpose: 1, createdAt: -1 });
