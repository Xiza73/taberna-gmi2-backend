import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { DomainConflictException, DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { STAFF_INVITATION_REPOSITORY, type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';
import { STAFF_MEMBER_REPOSITORY, type IStaffMemberRepository } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from '@modules/auth/domain/interfaces/refresh-token-repository.interface';
import { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';
import { type AcceptInvitationDto } from '../dtos/accept-invitation.dto';
import { AuthTokensResponseDto } from '@modules/auth/application/dtos/auth-tokens-response.dto';

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    compositeToken: string,
    dto: AcceptInvitationDto,
  ): Promise<AuthTokensResponseDto> {
    // Split and validate token
    const parts = compositeToken.split('.');
    if (parts.length !== 2) {
      throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
    }

    const [id, rawToken] = parts;

    // Find invitation by id
    const invitation = await this.staffInvitationRepository.findById(id);
    if (!invitation) {
      throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
    }

    // Compare raw token with stored hash
    const match = await compare(rawToken, invitation.tokenHash);
    if (!match) {
      throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
    }

    // Check invitation status
    if (invitation.isRevoked) {
      throw new DomainException(ErrorMessages.INVITATION_REVOKED);
    }

    if (invitation.acceptedAt) {
      throw new DomainException(ErrorMessages.INVITATION_ALREADY_ACCEPTED);
    }

    if (invitation.isExpired) {
      throw new DomainException(ErrorMessages.INVITATION_EXPIRED);
    }

    // Check email not already used
    const existingStaff = await this.staffMemberRepository.findByEmail(invitation.email);
    if (existingStaff) {
      throw new DomainConflictException(ErrorMessages.STAFF_EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hash(dto.password, 12);

    // Create staff member
    const staffMember = StaffMember.create({
      name: dto.name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    // Save staff member
    const savedStaff = await this.staffMemberRepository.save(staffMember);

    // Mark invitation as accepted
    invitation.accept();
    await this.staffInvitationRepository.save(invitation);

    // Generate JWT tokens
    const payload = {
      sub: savedStaff.id,
      email: savedStaff.email,
      name: savedStaff.name,
      role: 'staff',
      subjectType: 'staff',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Generate refresh token
    const rawRefresh = randomUUID();
    const refreshHash = await hash(rawRefresh, 12);

    const refreshToken = RefreshToken.create({
      userId: savedStaff.id,
      tokenHash: refreshHash,
      familyId: randomUUID(),
      expiresAt: new Date(
        Date.now() +
          this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800) * 1000,
      ),
      subjectType: 'staff',
    });

    const savedRefreshToken = await this.refreshTokenRepository.save(refreshToken);
    const compositeRefresh = `${savedRefreshToken.id}.${rawRefresh}`;

    return new AuthTokensResponseDto(accessToken, compositeRefresh);
  }
}
