import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { JournalEntry, journalEntrySchema } from './schema/journal-entry.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: JournalEntry.name, schema: journalEntrySchema }])],
  controllers: [JournalController],
  providers: [JournalService, AuthGuard],
})
export class JournalModule {}
