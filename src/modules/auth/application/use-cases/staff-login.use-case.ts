import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainUnauthorizedException } from '@shared/domain/exceptions/index.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface.js';
import { type StaffMember } from '../../../staff/domain/entities/staff-member.entity.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type LoginDto } from '../dtos/login.dto.js';
import { AuthTokensResponseDto } from '../dtos/auth-tokens-response.dto.js';

@Injectable()
export class StaffLoginUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokensResponseDto> {
    const staff = await this.staffRepository.findByEmail(dto.email);
    if (!staff)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    if (!staff.isActive)
      throw new DomainUnauthorizedException(ErrorMessages.USER_SUSPENDED);

    const valid = await compare(dto.password, staff.password);
    if (!valid)
      throw new DomainUnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    return this.generateTokens(staff);
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
