import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { SupportSender } from '../support-message.enums';

export type SupportMessageDocument = HydratedDocument<SupportMessage>;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: SupportSender, required: true })
  sender!: SupportSender;

  @Prop({ type: String, required: true, maxlength: 1000 })
  content!: string;

  @Prop({ type: Boolean, default: false })
  readByUser!: boolean;

  @Prop({ type: Boolean, default: false })
  readByAdmin!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const supportMessageSchema = SchemaFactory.createForClass(SupportMessage);
supportMessageSchema.index({ userId: 1, createdAt: 1 });
supportMessageSchema.index({ sender: 1, readByAdmin: 1, createdAt: -1 });
