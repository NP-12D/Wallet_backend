import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CreateMoneyRequestDto } from './dto/create-money-request.dto';
import { MoneyRequestsService } from './money-requests.service';

@Controller('money-requests')
@ApiTags('money-requests')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class MoneyRequestsController {
  constructor(private readonly moneyRequestsService: MoneyRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Ask another wallet user for money' })
  create(@User() userId: string, @Body() body: CreateMoneyRequestDto) {
    return this.moneyRequestsService.create(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get incoming and outgoing money requests' })
  list(@User() userId: string) {
    return this.moneyRequestsService.list(userId);
  }

  @Get('pending-count')
  @ApiOperation({ summary: 'Get the count of incoming pending money requests' })
  pendingCount(@User() userId: string) {
    return this.moneyRequestsService.getPendingIncomingCount(userId);
  }

  @Post(':requestId/fulfill')
  @ApiOperation({ summary: 'Pay an incoming money request' })
  fulfill(@User() userId: string, @Param('requestId') requestId: string) {
    return this.moneyRequestsService.fulfill(userId, requestId);
  }

  @Post(':requestId/decline')
  @ApiOperation({ summary: 'Decline an incoming money request' })
  decline(@User() userId: string, @Param('requestId') requestId: string) {
    return this.moneyRequestsService.decline(userId, requestId);
  }
}
