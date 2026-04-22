import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { DomainConflictException } from '@shared/domain/exceptions/index';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { type RegisterDto } from '../dtos/register.dto';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthTokensResponseDto> {
    const existing = await this.customerRepository.findByEmail(dto.email);
    if (existing)
      throw new DomainConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);

    const hashedPassword = await hash(dto.password, 12);
    const customer = Customer.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
    });

    const saved = await this.customerRepository.save(customer);

    this.emailSender
      .sendWelcome({ name: saved.name, email: saved.email })
      .catch(() => {});

    return this.generateTokens(saved);
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
