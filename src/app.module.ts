import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI');

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