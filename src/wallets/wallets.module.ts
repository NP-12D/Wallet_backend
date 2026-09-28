import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { Wallet, walletSchema } from './schema/wallet.schema';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: walletSchema }]),
    UsersModule,
    TransactionsModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, AuthGuard],
  exports: [WalletsService],
})
export class WalletsModule {}
