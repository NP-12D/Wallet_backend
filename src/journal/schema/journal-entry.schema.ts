import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { JournalEntryType } from '../journal.enums';

export type JournalEntryDocument = HydratedDocument<JournalEntry>;

@Schema({ timestamps: true })
export class JournalEntry {
  @Prop({ type: String, required: true, unique: true, index: true })
  entryId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: JournalEntryType, required: true })
  type!: JournalEntryType;

  @Prop({ type: Number, required: true, min: 1 })
  amount!: number;

  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  counterparty!: string;

  @Prop({ type: String, trim: true, maxlength: 500, default: '' })
  note!: string;

  @Prop({ type: Date, required: true, index: true })
  occurredAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const journalEntrySchema = SchemaFactory.createForClass(JournalEntry);
journalEntrySchema.index({ userId: 1, occurredAt: -1, createdAt: -1 });
