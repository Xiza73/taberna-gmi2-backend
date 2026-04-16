import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ErrorMessages } from '../../domain/constants/error-messages.js';
import { DomainUnauthorizedException } from '../../domain/exceptions/index.js';
import { USER_REPOSITORY } from '../../../modules/users/domain/interfaces/user-repository.interface.js';
import { type IUserRepository } from '../../../modules/users/domain/interfaces/user-repository.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly userRepository?: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const token = this.extractToken(
      request as { headers: { authorization?: string } },
    );
    if (!token) {
      throw new DomainUnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        name: string;
        role: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Load user from DB to verify active status
      if (this.userRepository) {
        const user = await this.userRepository.findById(payload.sub);
        if (!user) throw new DomainUnauthorizedException();
        if (!user.isActive)
          throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);

        request['user'] = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      } else {
        request['user'] = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        };
      }
    } catch (error) {
      if (error instanceof DomainUnauthorizedException) throw error;
      throw new DomainUnauthorizedException();
    }

    return true;
  }

  private extractToken(request: {
    headers: { authorization?: string };
  }): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
