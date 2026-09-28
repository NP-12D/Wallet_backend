import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum WebhookStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class WebhookDto {
  @ApiProperty({ example: 'tx_987654' })
  @IsNotEmpty()
  @IsString()
  transaction_id!: string;

  @ApiProperty({ enum: WebhookStatus, example: WebhookStatus.SUCCESS })
  @IsEnum(WebhookStatus)
  status!: WebhookStatus;
}
