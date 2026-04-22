import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { STAFF_ROLE_KEY } from '../decorators/staff-role.decorator';
import { type AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { DomainForbiddenException } from '../../domain/exceptions/index';

@Injectable()
export class StaffRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      STAFF_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const user = request['user'] as AuthenticatedUser | undefined;
    if (!user) return false;

    if (user.subjectType !== 'staff') {
      throw new DomainForbiddenException();
    }

    if (!requiredRoles.includes(user.role)) {
      throw new DomainForbiddenException();
    }

    return true;
  }
}
