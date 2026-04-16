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
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type RefreshTokenDto } from '../dtos/refresh-token.dto.js';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto.js';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    const [tokenId, rawToken] = dto.refreshToken.split('.');
    if (!tokenId || !rawToken) {
      throw new DomainUnauthorizedException(
        ErrorMessages.INVALID_REFRESH_TOKEN,
      );
    }

    const storedToken = await this.refreshTokenRepository.findById(tokenId);
    if (!storedToken) {
      throw new DomainUnauthorizedException(
        ErrorMessages.INVALID_REFRESH_TOKEN,
      );
    }

    // Reuse detection: token already revoked → revoke entire family
    if (storedToken.isRevoked) {
      await this.refreshTokenRepository.revokeByFamily(storedToken.familyId);
      throw new DomainUnauthorizedException(ErrorMessages.REFRESH_TOKEN_REUSED);
    }

    if (storedToken.isExpired()) {
      throw new DomainUnauthorizedException(
        ErrorMessages.INVALID_REFRESH_TOKEN,
      );
    }

    const valid = await compare(rawToken, storedToken.tokenHash);
    if (!valid) {
      throw new DomainUnauthorizedException(
        ErrorMessages.INVALID_REFRESH_TOKEN,
      );
    }

    // Revoke old token
    storedToken.revoke();
    await this.refreshTokenRepository.save(storedToken);

    // Load user
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);
    }

    // Generate new tokens (same family)
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const newRawToken = randomUUID();
    const newTokenHash = await hash(newRawToken, 12);
    const refreshExpiration = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION',
      604800,
    );
    const expiresAt = new Date(Date.now() + refreshExpiration * 1000);

    const newRefreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId,
      expiresAt,
    });
    const savedToken = await this.refreshTokenRepository.save(newRefreshToken);

    const compositeToken = `${savedToken.id}.${newRawToken}`;
    return new AuthTokensResponseDto(accessToken, compositeToken);
  }
}
