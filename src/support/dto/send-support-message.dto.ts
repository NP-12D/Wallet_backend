import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SendSupportMessageDto {
  @ApiProperty({ example: 'How do I transfer money?' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 1000)
  content!: string;
}
