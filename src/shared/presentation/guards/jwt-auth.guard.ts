import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { DomainUnauthorizedException } from '../../domain/exceptions/index.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new DomainUnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    } catch {
      throw new DomainUnauthorizedException();
    }

    return true;
  }

  private extractToken(request: { headers: { authorization?: string } }): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
