import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JournalService } from './journal.service';

@Controller('journal')
@ApiTags('journal')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a personal money journal entry' })
  create(@User() userId: string, @Body() body: CreateJournalEntryDto) {
    return this.journalService.create(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List personal money journal entries' })
  list(@User() userId: string) {
    return this.journalService.list(userId);
  }

  @Patch(':entryId')
  @ApiOperation({ summary: 'Update a personal money journal entry' })
  update(@User() userId: string, @Param('entryId') entryId: string, @Body() body: UpdateJournalEntryDto) {
    return this.journalService.update(userId, entryId, body);
  }

  @Delete(':entryId')
  @ApiOperation({ summary: 'Delete a personal money journal entry' })
  remove(@User() userId: string, @Param('entryId') entryId: string) {
    return this.journalService.remove(userId, entryId);
  }
}
