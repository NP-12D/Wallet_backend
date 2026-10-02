import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportMessage, supportMessageSchema } from './schema/support-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportMessage.name, schema: supportMessageSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
