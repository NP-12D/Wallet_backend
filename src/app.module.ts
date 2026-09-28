import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
          throw new Error(
            'MONGO_URI is not defined. Add it to backend/.env or your environment variables.',
          );
        }

        return { uri: mongoUri };
      },
    }),
    UsersModule,
    AuthModule,
    WalletsModule,
    PaymentsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
