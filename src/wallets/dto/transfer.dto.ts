import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'user2@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  receiver_email!: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'Dinner repayment', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;
}
