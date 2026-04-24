import { Inject, Injectable } from '@nestjs/common';
import { compare } from 'bcryptjs';

import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { STAFF_INVITATION_REPOSITORY, type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';
import { STAFF_MEMBER_REPOSITORY, type IStaffMemberRepository } from '../../domain/interfaces/staff-member-repository.interface';
import { ValidateInvitationResponseDto } from '../dtos/validate-invitation-response.dto';

@Injectable()
export class ValidateInvitationUseCase {
  constructor(
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(compositeToken: string): Promise<ValidateInvitationResponseDto> {
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

    // Get inviter info
    const inviter = await this.staffMemberRepository.findById(invitation.invitedBy);

    return new ValidateInvitationResponseDto(
      invitation.email,
      invitation.role,
      inviter?.name ?? 'Admin',
    );
  }
}
