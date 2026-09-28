import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TransactionType } from '../transaction.enums';

export class ExportQueryDto {
  @ApiPropertyOptional({ example: 'csv', enum: ['csv'] })
  @IsOptional()
  @IsIn(['csv'])
  format?: 'csv' = 'csv';

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 'tx 28' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
