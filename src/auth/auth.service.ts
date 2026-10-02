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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private walletsService: WalletsService,
    private jwtService: JwtService,
    @InjectConnection() private connection: Connection,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const hashedPass = await bcrypt.hash(registerDto.password, 10);
      const user = await this.usersService.create(
        { ...registerDto, password: hashedPass },
        session,
      );
      const wallet = await this.walletsService.createForUser(user._id, session);
      await this.usersService.attachWallet(
        user._id,
        wallet._id,
        session,
      );

      await session.commitTransaction();
      return {
        message: 'Registration successful. Please sign in.',
      };
    } catch (error) {
      await session.abortTransaction();
      if (error) {
        throw new BadRequestException('User with this email already exists');
      }
      throw error;
    } finally {
      await session.endSession();
    }
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

    return this.createAuthResponse(existingUser);
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
