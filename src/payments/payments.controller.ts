import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CheckoutDto } from './dto/checkout.dto';
import { WebhookDto } from './dto/webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@ApiTags('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Post('/checkout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a pending top-up transaction' })
  checkout(@User() userId: string, @Body() body: CheckoutDto) {
    return this.paymentsService.checkout(userId, body);
  }

  @Post('/webhook')
  @ApiOperation({ summary: 'Mock payment gateway webhook' })
  webhook(@Body() body: WebhookDto) {
    return this.paymentsService.webhook(body);
  }
}
