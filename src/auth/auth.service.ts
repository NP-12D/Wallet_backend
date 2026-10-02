import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/schema/user.schema';
import { WalletsService } from 'src/wallets/wallets.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from 'src/email-codes/dto/verify-code.dto';
import { EmailCodesService } from 'src/email-codes/email-codes.service';
import { EmailCodePurpose } from 'src/email-codes/email-code.enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private walletsService: WalletsService,
    private jwtService: JwtService,
    private emailCodesService: EmailCodesService,
    @InjectConnection() private connection: Connection,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      if (!existingUser.emailVerified) {
        return this.emailCodesService.issue(
          existingUser._id,
          existingUser.email,
          EmailCodePurpose.REGISTRATION,
        );
      }
      throw new BadRequestException('User with this email already exists');
    }

    const session = await this.connection.startSession();
    let createdUser: UserDocument | null = null;

    try {
      session.startTransaction();

      const hashedPass = await bcrypt.hash(registerDto.password, 10);
      const user = await this.usersService.create(
        { ...registerDto, password: hashedPass, emailVerified: false },
        session,
      );
      const wallet = await this.walletsService.createForUser(user._id, session);
      await this.usersService.attachWallet(
        user._id,
        wallet._id,
        session,
      );

      await session.commitTransaction();
      createdUser = user;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      if ((error as { code?: number })?.code === 11000) {
        throw new BadRequestException('User with this email already exists');
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (!createdUser) {
      throw new BadRequestException('Could not create the account');
    }

    return this.emailCodesService.issue(
      createdUser._id,
      createdUser.email,
      EmailCodePurpose.REGISTRATION,
    );
  }

  async login(loginDto: LoginDto) {
    const existingUser = await this.usersService.findOneByEmail(
      loginDto.email,
      true,
    );
    if (!existingUser) throw new UnauthorizedException('Invalid credentials');

    const isEqualPass = await bcrypt.compare(
      loginDto.password,
      existingUser.password,
    );
    if (!isEqualPass) throw new UnauthorizedException('Invalid credentials');
    if (!existingUser.emailVerified) {
      throw new BadRequestException('Verify your email address before signing in');
    }

    return this.emailCodesService.issue(
      existingUser._id,
      existingUser.email,
      EmailCodePurpose.LOGIN,
    );
  }

  async verifyRegistration(dto: VerifyCodeDto) {
    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid verification request');
    await this.emailCodesService.verify(user._id, EmailCodePurpose.REGISTRATION, dto.code);
    await this.usersService.setEmailVerified(user._id);

    return { message: 'Email verified. You can now sign in.' };
  }

  async verifyLogin(dto: VerifyCodeDto) {
    const user = await this.usersService.findOneByEmail(dto.email, true);
    if (!user || !user.emailVerified) {
      throw new UnauthorizedException('Invalid verification request');
    }
    await this.emailCodesService.verify(user._id, EmailCodePurpose.LOGIN, dto.code);

    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: UserDocument) {
    const payLoad = {
      userId: user._id.toString(),
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payLoad, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any,
      secret: process.env.JWT_SECRET,
    });

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        walletId: user.walletId?.toString(),
        isAdmin: this.isAdmin(user.email),
      },
      token,
    };
  }

  private isAdmin(email: string) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return Boolean(adminEmail && email.toLowerCase() === adminEmail);
  }
}
