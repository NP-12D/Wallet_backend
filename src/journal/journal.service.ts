import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { centsToAmount, parseAmountToCents } from 'src/common/utils/money.util';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JournalEntry, JournalEntryDocument } from './schema/journal-entry.schema';

@Injectable()
export class JournalService {
  constructor(
    @InjectModel(JournalEntry.name)
    private readonly journalEntryModel: Model<JournalEntryDocument>,
  ) {}

  async create(userId: string, dto: CreateJournalEntryDto) {
    const entry = await this.journalEntryModel.create({
      entryId: `jr_${randomUUID()}`,
      userId,
      type: dto.type,
      amount: parseAmountToCents(dto.amount),
      counterparty: dto.counterparty.trim(),
      note: dto.note?.trim() ?? '',
      occurredAt: new Date(dto.occurredAt),
    });
    return this.serialize(entry);
  }

  async list(userId: string) {
    const entries = await this.journalEntryModel
      .find({ userId })
      .sort({ occurredAt: -1, createdAt: -1 })
      .limit(100);
    return entries.map((entry) => this.serialize(entry));
  }

  async update(userId: string, entryId: string, dto: UpdateJournalEntryDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.amount !== undefined) update.amount = parseAmountToCents(dto.amount);
    if (dto.counterparty !== undefined) update.counterparty = dto.counterparty.trim();
    if (dto.note !== undefined) update.note = dto.note.trim();
    if (dto.occurredAt !== undefined) update.occurredAt = new Date(dto.occurredAt);

    const entry = await this.journalEntryModel.findOneAndUpdate(
      { entryId, userId },
      { $set: update },
      { new: true },
    );
    if (!entry) throw new NotFoundException('Journal entry not found');
    return this.serialize(entry);
  }

  async remove(userId: string, entryId: string) {
    const entry = await this.journalEntryModel.findOneAndDelete({ entryId, userId });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return { message: 'Journal entry deleted' };
  }

  private serialize(entry: JournalEntryDocument) {
    return {
      entryId: entry.entryId,
      type: entry.type,
      amount: centsToAmount(entry.amount),
      counterparty: entry.counterparty,
      note: entry.note,
      occurredAt: entry.occurredAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
