import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainUnauthorizedException } from '@shared/domain/exceptions/index.js';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/interfaces/user-repository.interface.js';
import { type User } from '../../../users/domain/entities/user.entity.js';
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
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokensResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    if (!user.isActive)
      throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);

    const valid = await compare(dto.password, user.password);
    if (!valid)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    return this.generateTokens(user);
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
