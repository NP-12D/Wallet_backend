import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import {
  Transaction,
  transactionSchema,
} from 'src/transactions/schema/transaction.schema';
import { Wallet, walletSchema } from 'src/wallets/schema/wallet.schema';
import { WalletsModule } from 'src/wallets/wallets.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: transactionSchema },
      { name: Wallet.name, schema: walletSchema },
    ]),
    WalletsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuthGuard],
})
export class PaymentsModule {}
