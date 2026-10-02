import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportService } from './support.service';

@Controller('support')
@ApiTags('support')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('access')
  @ApiOperation({ summary: 'Get support access for the authenticated user' })
  getAccess(@User() userId: string) {
    return this.supportService.getAccess(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread support message count for the authenticated user' })
  getUnreadCount(@User() userId: string) {
    return this.supportService.getUnreadCount(userId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get the authenticated user support conversation' })
  getMessages(@User() userId: string) {
    return this.supportService.getUserConversation(userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to wallet support' })
  sendMessage(@User() userId: string, @Body() body: SendSupportMessageDto) {
    return this.supportService.sendUserMessage(userId, body);
  }

  @Get('admin/conversations')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all support conversations for the admin' })
  getAdminConversations() {
    return this.supportService.getAdminConversations();
  }

  @Get('admin/conversations/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Read one support conversation as an admin' })
  getAdminConversation(@Param('userId') userId: string) {
    return this.supportService.getAdminConversation(userId);
  }

  @Post('admin/conversations/:userId/messages')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Reply to a wallet support conversation as an admin' })
  sendAdminMessage(@Param('userId') userId: string, @Body() body: SendSupportMessageDto) {
    return this.supportService.sendAdminMessage(userId, body);
  }
}
