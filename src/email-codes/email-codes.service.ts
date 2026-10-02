import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import { MailService } from 'src/mail/mail.service';
import { EmailCodePurpose } from './email-code.enums';
import { EmailCode, EmailCodeDocument } from './schema/email-code.schema';

type TransferDetails = {
  receiverEmail: string;
  amount: number;
  description: string;
};

@Injectable()
export class EmailCodesService {
  constructor(
    @InjectModel(EmailCode.name)
    private readonly emailCodeModel: Model<EmailCodeDocument>,
    private readonly mailService: MailService,
  ) {}

  async issue(
    userId: string | Types.ObjectId,
    email: string,
    purpose: EmailCodePurpose,
    transfer?: TransferDetails,
  ) {
    const now = new Date();
    await this.emailCodeModel.updateMany(
      { userId, purpose, consumedAt: { $exists: false } },
      { $set: { consumedAt: now } },
    );

    const code = randomInt(1000, 10000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    await this.emailCodeModel.create({
      userId,
      purpose,
      codeHash,
      expiresAt,
      ...(transfer ?? {}),
    });

    await this.mailService.sendVerificationCode(email, code, this.purposeLabel(purpose));
    return { message: 'A four-digit verification code was sent to your email.' };
  }

  async verify(
    userId: string | Types.ObjectId,
    purpose: EmailCodePurpose,
    code: string,
  ) {
    const record = await this.emailCodeModel
      .findOne({ userId, purpose, consumedAt: { $exists: false } })
      .sort({ createdAt: -1 });

    if (!record || record.expiresAt <= new Date()) {
      throw new BadRequestException('This verification code has expired. Request a new one.');
    }
    if (record.attempts >= 5) {
      throw new BadRequestException('Too many incorrect attempts. Request a new code.');
    }

    const matches = await bcrypt.compare(code, record.codeHash);
    if (!matches) {
      await this.emailCodeModel.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      throw new UnauthorizedException('Incorrect verification code');
    }

    const consumed = await this.emailCodeModel.findOneAndUpdate(
      { _id: record._id, consumedAt: { $exists: false } },
      { $set: { consumedAt: new Date() } },
      { new: true },
    );
    if (!consumed) throw new BadRequestException('This verification code has already been used.');
    return consumed;
  }

  private purposeLabel(purpose: EmailCodePurpose) {
    if (purpose === EmailCodePurpose.TRANSFER) return 'transfer confirmation';
    if (purpose === EmailCodePurpose.LOGIN) return 'sign-in';
    return 'registration';
  }
}
