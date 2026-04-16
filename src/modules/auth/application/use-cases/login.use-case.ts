import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainUnauthorizedException } from '@shared/domain/exceptions/index.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface.js';
import { type Customer } from '../../../customers/domain/entities/customer.entity.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type LoginDto } from '../dtos/login.dto.js';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokensResponseDto> {
    const customer = await this.customerRepository.findByEmail(dto.email);
    if (!customer)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    if (!customer.isActive)
      throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);

    const valid = await compare(dto.password, customer.password);
    if (!valid)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    return this.generateTokens(customer);
  }

  private async generateTokens(
    customer: Customer,
  ): Promise<AuthTokensResponseDto> {
    const payload = {
      sub: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
      subjectType: 'customer',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const rawToken = randomUUID();
    const tokenHash = await hash(rawToken, 12);
    const familyId = randomUUID();
    const refreshExpiration = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION',
      604800,
    );
    const expiresAt = new Date(Date.now() + refreshExpiration * 1000);

    const refreshToken = RefreshToken.create({
      userId: customer.id,
      tokenHash,
      familyId,
      expiresAt,
      subjectType: 'customer',
    });
    const savedToken = await this.refreshTokenRepository.save(refreshToken);

    const compositeToken = `${savedToken.id}.${rawToken}`;
    return new AuthTokensResponseDto(accessToken, compositeToken);
  }
}
