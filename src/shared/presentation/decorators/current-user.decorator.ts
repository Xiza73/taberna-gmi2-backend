import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request['user'] as AuthenticatedUser | undefined;
    return data ? user?.[data] : user;
  },
);
