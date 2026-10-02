import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UsersModule } from 'src/users/users.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { MoneyRequestsController } from './money-requests.controller';
import { MoneyRequestsService } from './money-requests.service';
import { MoneyRequest, moneyRequestSchema } from './schema/money-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MoneyRequest.name, schema: moneyRequestSchema },
    ]),
    UsersModule,
    WalletsModule,
  ],
  controllers: [MoneyRequestsController],
  providers: [MoneyRequestsService, AuthGuard],
})
export class MoneyRequestsModule {}
