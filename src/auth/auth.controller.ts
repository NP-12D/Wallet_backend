import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
  @ApiOperation({ summary: 'Login and receive a JWT token' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
