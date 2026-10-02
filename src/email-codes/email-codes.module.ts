import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'src/mail/mail.module';
import { EmailCodesService } from './email-codes.service';
import { EmailCode, emailCodeSchema } from './schema/email-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EmailCode.name, schema: emailCodeSchema }]),
    MailModule,
  ],
  providers: [EmailCodesService],
  exports: [EmailCodesService],
})
export class EmailCodesModule {}
