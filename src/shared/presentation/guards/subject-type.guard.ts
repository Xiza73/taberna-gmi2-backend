import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SUBJECT_TYPE_KEY } from '../decorators/subject-type.decorator.js';
import { type AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class SubjectTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<string[]>(
      SUBJECT_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredTypes) return true;

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const user = request['user'] as AuthenticatedUser | undefined;
    if (!user) return false;

    return requiredTypes.includes(user.subjectType);
  }
}
