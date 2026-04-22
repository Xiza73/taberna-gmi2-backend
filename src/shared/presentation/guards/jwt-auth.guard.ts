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
import { CUSTOMER_REPOSITORY } from '../../../modules/customers/domain/interfaces/customer-repository.interface.js';
import { type ICustomerRepository } from '../../../modules/customers/domain/interfaces/customer-repository.interface.js';
import { STAFF_MEMBER_REPOSITORY } from '../../../modules/staff/domain/interfaces/staff-member-repository.interface.js';
import { type IStaffMemberRepository } from '../../../modules/staff/domain/interfaces/staff-member-repository.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @Optional()
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository?: ICustomerRepository,
    @Optional()
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository?: IStaffMemberRepository,
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
        subjectType?: 'customer' | 'staff';
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const subjectType = payload.subjectType ?? 'customer';

      if (subjectType === 'staff' && this.staffRepository) {
        const staff = await this.staffRepository.findById(payload.sub);
        if (!staff) throw new DomainUnauthorizedException();
        if (!staff.isActive)
          throw new DomainUnauthorizedException(ErrorMessages.STAFF_SUSPENDED);

        request['user'] = {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          subjectType: 'staff',
        };
      } else if (this.customerRepository) {
        const customer = await this.customerRepository.findById(payload.sub);
        if (!customer) throw new DomainUnauthorizedException();
        if (!customer.isActive)
          throw new DomainUnauthorizedException(
            ErrorMessages.CUSTOMER_SUSPENDED,
          );

        request['user'] = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: 'customer',
          subjectType: 'customer',
        };
      } else {
        request['user'] = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          subjectType,
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
