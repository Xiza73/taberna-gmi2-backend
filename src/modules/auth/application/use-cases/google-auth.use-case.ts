import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  DomainException,
  DomainUnauthorizedException,
} from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface.js';
import { Customer } from '../../../customers/domain/entities/customer.entity.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type GoogleAuthDto } from '../dtos/google-auth.dto.js';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto.js';

@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);
  private readonly oauthClient: OAuth2Client;

  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.oauthClient = new OAuth2Client(clientId);
  }

  async execute(dto: GoogleAuthDto): Promise<AuthTokensResponseDto> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    if (!clientId) {
      throw new DomainException('Google OAuth is not configured');
    }

    const payload = await this.verifyIdToken(dto.idToken, clientId);

    const {
      sub: googleId,
      email,
      name,
      email_verified: emailVerified,
    } = payload;
    if (!email || !googleId) {
      throw new DomainUnauthorizedException('Invalid Google token payload');
    }
    if (!emailVerified) {
      throw new DomainUnauthorizedException('Google email is not verified');
    }

    let customer = await this.customerRepository.findByGoogleId(googleId);

    if (customer) {
      if (!customer.isActive) {
        throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);
      }
      return this.generateTokens(customer);
    }

    const existingByEmail = await this.customerRepository.findByEmail(email);

    if (existingByEmail) {
      if (!existingByEmail.isActive) {
        throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);
      }
      if (existingByEmail.googleId) {
        throw new DomainUnauthorizedException(
          'This email is linked to a different Google account',
        );
      }
      existingByEmail.linkGoogle(googleId);
      customer = await this.customerRepository.save(existingByEmail);
      return this.generateTokens(customer);
    }

    const randomPassword = await hash(randomUUID(), 12);
    const newCustomer = Customer.create({
      name: name || email.split('@')[0],
      email,
      password: randomPassword,
      googleId,
    });

    customer = await this.customerRepository.save(newCustomer);

    this.emailSender
      .sendWelcome({ name: customer.name, email: customer.email })
      .catch(() => {});

    return this.generateTokens(customer);
  }

  private async verifyIdToken(idToken: string, clientId: string) {
    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new DomainUnauthorizedException('Invalid Google ID token');
      }
      return payload;
    } catch (error) {
      if (error instanceof DomainUnauthorizedException) throw error;
      this.logger.warn(
        `Google token verification failed: ${(error as Error).message}`,
      );
      throw new DomainUnauthorizedException('Invalid Google ID token');
    }
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
