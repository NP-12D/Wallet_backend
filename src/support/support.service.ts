import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportSender } from './support-message.enums';
import { SupportMessage, SupportMessageDocument } from './schema/support-message.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportMessage.name)
    private readonly supportMessageModel: Model<SupportMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async getAccess(userId: string) {
    const user = await this.usersService.findOne(userId);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    return {
      isAdmin: Boolean(adminEmail && user.email.toLowerCase() === adminEmail),
    };
  }

  async getUnreadCount(userId: string) {
    const user = await this.usersService.findOne(userId);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isAdmin = Boolean(adminEmail && user.email.toLowerCase() === adminEmail);
    const count = await this.supportMessageModel.countDocuments(
      isAdmin
        ? { sender: SupportSender.USER, readByAdmin: false }
        : {
            userId: user._id,
            sender: SupportSender.ADMIN,
            readByUser: false,
          },
    );

    return { count, isAdmin };
  }

  async getUserConversation(userId: string) {
    const user = await this.usersService.findOne(userId);
    const messages = await this.supportMessageModel
      .find({ userId: user._id })
      .sort({ createdAt: 1 });

    await this.supportMessageModel.updateMany(
      { userId: user._id, sender: SupportSender.ADMIN, readByUser: false },
      { $set: { readByUser: true } },
    );

    return messages.map((message) => this.serializeMessage(message));
  }

  async sendUserMessage(userId: string, dto: SendSupportMessageDto) {
    const user = await this.usersService.findOne(userId);
    const message = await this.createMessage(user._id, SupportSender.USER, dto.content);
    return this.serializeMessage(message);
  }

  async getAdminConversations() {
    const conversations = await this.supportMessageModel.aggregate<{
      _id: Types.ObjectId;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$sender', SupportSender.USER] },
                    { $eq: ['$readByAdmin', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    return Promise.all(
      conversations.map(async (conversation) => {
        const user = await this.usersService.findOne(conversation._id);
        return {
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
          },
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount,
        };
      }),
    );
  }

  async getAdminConversation(userId: string) {
    const user = await this.usersService.findOne(userId);
    const messages = await this.supportMessageModel
      .find({ userId: user._id })
      .sort({ createdAt: 1 });

    await this.supportMessageModel.updateMany(
      { userId: user._id, sender: SupportSender.USER, readByAdmin: false },
      { $set: { readByAdmin: true } },
    );

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      messages: messages.map((message) => this.serializeMessage(message)),
    };
  }

  async sendAdminMessage(userId: string, dto: SendSupportMessageDto) {
    const user = await this.usersService.findOne(userId);
    const message = await this.createMessage(user._id, SupportSender.ADMIN, dto.content);
    return this.serializeMessage(message);
  }

  private async createMessage(
    userId: Types.ObjectId,
    sender: SupportSender,
    content: string,
  ) {
    const trimmedContent = content.trim();
    if (!trimmedContent) throw new BadRequestException('Message cannot be empty');

    return this.supportMessageModel.create({
      userId,
      sender,
      content: trimmedContent,
      readByUser: sender === SupportSender.USER,
      readByAdmin: sender === SupportSender.ADMIN,
    });
  }

  private serializeMessage(message: SupportMessageDocument) {
    return {
      id: message._id.toString(),
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
