import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from 'src/email-codes/dto/verify-code.dto';

@Controller()
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new wallet user' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Validate credentials and send a sign-in code' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('/register/verify')
  @ApiOperation({ summary: 'Verify the email code sent during registration' })
  verifyRegistration(@Body() body: VerifyCodeDto) {
    return this.authService.verifyRegistration(body);
  }

  @Post('/login/verify')
  @ApiOperation({ summary: 'Verify the email code sent during login' })
  verifyLogin(@Body() body: VerifyCodeDto) {
    return this.authService.verifyLogin(body);
  }
}
