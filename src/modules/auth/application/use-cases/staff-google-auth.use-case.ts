import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  DomainException,
  DomainUnauthorizedException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface';
import { type StaffMember } from '../../../staff/domain/entities/staff-member.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { type GoogleAuthDto } from '../dtos/google-auth.dto';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto';

@Injectable()
export class StaffGoogleAuthUseCase {
  private readonly logger = new Logger(StaffGoogleAuthUseCase.name);
  private readonly oauthClient: OAuth2Client;

  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
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

    const { email, email_verified: emailVerified } = payload;
    if (!email) {
      throw new DomainUnauthorizedException('Invalid Google token payload');
    }
    if (!emailVerified) {
      throw new DomainUnauthorizedException('Google email is not verified');
    }

    const staff = await this.staffRepository.findByEmail(email);
    if (!staff) {
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }
    if (!staff.isActive) {
      throw new DomainUnauthorizedException(ErrorMessages.STAFF_SUSPENDED);
    }

    return this.generateTokens(staff);
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
    staff: StaffMember,
  ): Promise<AuthTokensResponseDto> {
    const payload = {
      sub: staff.id,
      email: staff.email,
      name: staff.name,
      role: 'staff',
      subjectType: 'staff',
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
      userId: staff.id,
      tokenHash,
      familyId,
      expiresAt,
      subjectType: 'staff',
    });
    const savedToken = await this.refreshTokenRepository.save(refreshToken);

    const compositeToken = `${savedToken.id}.${rawToken}`;
    return new AuthTokensResponseDto(accessToken, compositeToken);
  }
}
