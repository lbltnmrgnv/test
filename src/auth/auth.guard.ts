import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User;
  accessToken: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization Bearer token is required.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    request.user = await this.authService.findUserByToken(token);
    request.accessToken = token;

    return true;
  }
}
