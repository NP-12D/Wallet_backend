import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationCode(email: string, code: string, purpose: string) {
    const from = process.env.MAIL_FROM;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (brevoApiKey) {
      if (!from) {
        throw new ServiceUnavailableException(
          'Email delivery is not configured. Add MAIL_FROM.',
        );
      }
      return this.sendWithBrevoApi(email, code, purpose, from, brevoApiKey);
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass || !from) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Add BREVO_API_KEY for Render Free, or the Brevo SMTP variables for a paid host.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `Your Wallet Core ${purpose} code`,
      text: `Your Wallet Core verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
      html: `<p>Your Wallet Core verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
    });
  }

  private async sendWithBrevoApi(
    email: string,
    code: string,
    purpose: string,
    from: string,
    apiKey: string,
  ) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: this.toBrevoSender(from),
        to: [{ email }],
        subject: `Your Wallet Core ${purpose} code`,
        textContent: `Your Wallet Core verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
        htmlContent: `<p>Your Wallet Core verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
      }),
    });

    if (response.ok) return;

    const details = (await response.text()).slice(0, 500);
    this.logger.error(
      `Brevo API email request failed with ${response.status}: ${details}`,
    );
    throw new ServiceUnavailableException(
      'Brevo could not send the verification email. Check the API key and verified sender.',
    );
  }

  private toBrevoSender(from: string) {
    const match = from.trim().match(/^(?:\"?(.+?)\"?\s*)?<([^>]+)>$/);
    if (!match) return { email: from.trim() };

    const [, name, email] = match;
    return name
      ? { name: name.trim(), email: email.trim() }
      : { email: email.trim() };
  }
}
