import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.getToken(request.headers);
    if (!token) throw new UnauthorizedException('Unauthorized');

    try {
      const payLoad = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.userId = payLoad.userId;
      return true;
    } catch (error) {
      throw new BadRequestException('Invalid JWT');
    }
  }

  getToken(headers) {
    if (!headers['authorization']) return null;
    const [type, token] = headers['authorization'].split(' ');
    return type === 'Bearer' ? token : null;
  }
}
