import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainConflictException } from '@shared/domain/exceptions/index.js';
import { UserRole } from '@shared/domain/enums/user-role.enum.js';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/interfaces/user-repository.interface.js';
import { User } from '../../../users/domain/entities/user.entity.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type RegisterDto } from '../dtos/register.dto.js';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto.js';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthTokensResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing)
      throw new DomainConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);

    const hashedPassword = await hash(dto.password, 12);
    const user = User.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      phone: dto.phone,
    });

    const saved = await this.userRepository.save(user);

    this.emailSender
      .sendWelcome({ name: saved.name, email: saved.email })
      .catch(() => {});

    return this.generateTokens(saved);
  }

  private async generateTokens(user: User): Promise<AuthTokensResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });
    const savedToken = await this.refreshTokenRepository.save(refreshToken);

    const compositeToken = `${savedToken.id}.${rawToken}`;
    return new AuthTokensResponseDto(accessToken, compositeToken);
  }
}
