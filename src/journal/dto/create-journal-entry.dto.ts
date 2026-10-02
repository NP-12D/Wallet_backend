import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { JournalEntryType } from '../journal.enums';

export class CreateJournalEntryDto {
  @IsEnum(JournalEntryType)
  type!: JournalEntryType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  counterparty!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsDateString()
  occurredAt!: string;
}
