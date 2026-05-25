import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  DomainConflictException,
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import {
  STAFF_INVITATION_REPOSITORY,
  type IStaffInvitationRepository,
} from '../../domain/interfaces/staff-invitation-repository.interface';
import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '@modules/auth/domain/interfaces/refresh-token-repository.interface';
import { RefreshToken } from '@modules/auth/domain/entities/refresh-token.entity';
import { type RegisterStaffDto } from '../dtos/register-staff.dto';
import { AuthTokensResponseDto } from '@modules/auth/application/dtos/auth-tokens-response.dto';

@Injectable()
export class RegisterStaffUseCase {
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

  async execute(dto: RegisterStaffDto): Promise<AuthTokensResponseDto> {
    // Si la tabla staff_members está vacía, el solicitante es el primer
    // usuario del sistema y se promueve a SUPER_ADMIN sin necesidad de
    // invitación. A partir del segundo usuario la invitación es obligatoria.
    const staffCount = await this.staffMemberRepository.count();
    const isFirstUser = staffCount === 0;

    const normalizedEmail = dto.email.toLowerCase().trim();
    let role: StaffRole;
    let invitedBy: string | undefined;
    let invitationToAccept: Awaited<
      ReturnType<IStaffInvitationRepository['findById']>
    > | null = null;

    if (isFirstUser) {
      role = StaffRole.SUPER_ADMIN;
      invitedBy = undefined;
    } else {
      if (!dto.invitationToken) {
        throw new DomainForbiddenException(
          ErrorMessages.STAFF_REGISTRATION_REQUIRES_INVITATION,
        );
      }

      const parts = dto.invitationToken.split('.');
      if (parts.length !== 2) {
        throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
      }

      const [id, rawToken] = parts;
      const invitation = await this.staffInvitationRepository.findById(id);
      if (!invitation) {
        throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
      }

      const match = await compare(rawToken, invitation.tokenHash);
      if (!match) {
        throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
      }

      if (invitation.isRevoked) {
        throw new DomainException(ErrorMessages.INVITATION_REVOKED);
      }
      if (invitation.acceptedAt) {
        throw new DomainException(ErrorMessages.INVITATION_ALREADY_ACCEPTED);
      }
      if (invitation.isExpired) {
        throw new DomainException(ErrorMessages.INVITATION_EXPIRED);
      }

      // Seguridad: el email del formulario debe coincidir con el email
      // invitado, para evitar que cualquiera con el link arme una cuenta
      // con un email distinto.
      if (invitation.email.toLowerCase() !== normalizedEmail) {
        throw new DomainForbiddenException(
          ErrorMessages.STAFF_REGISTRATION_EMAIL_MISMATCH,
        );
      }

      role = invitation.role;
      invitedBy = invitation.invitedBy;
      invitationToAccept = invitation;
    }

    const existingStaff =
      await this.staffMemberRepository.findByEmail(normalizedEmail);
    if (existingStaff) {
      throw new DomainConflictException(
        ErrorMessages.STAFF_EMAIL_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await hash(dto.password, 12);

    const staffMember = StaffMember.create({
      name: dto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      invitedBy,
    });

    const savedStaff = await this.staffMemberRepository.save(staffMember);

    if (invitationToAccept) {
      invitationToAccept.accept();
      await this.staffInvitationRepository.save(invitationToAccept);
    }

    const payload = {
      sub: savedStaff.id,
      email: savedStaff.email,
      name: savedStaff.name,
      role: 'staff',
      subjectType: 'staff',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefresh = randomUUID();
    const refreshHash = await hash(rawRefresh, 12);

    const refreshToken = RefreshToken.create({
      userId: savedStaff.id,
      tokenHash: refreshHash,
      familyId: randomUUID(),
      expiresAt: new Date(
        Date.now() +
          this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800) *
            1000,
      ),
      subjectType: 'staff',
    });

    const savedRefreshToken =
      await this.refreshTokenRepository.save(refreshToken);
    const compositeRefresh = `${savedRefreshToken.id}.${rawRefresh}`;

    return new AuthTokensResponseDto(accessToken, compositeRefresh);
  }
}
