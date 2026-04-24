import { Inject, Injectable } from '@nestjs/common';

import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { STAFF_INVITATION_REPOSITORY, type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';

@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const invitation = await this.staffInvitationRepository.findById(id);
    if (!invitation) {
      throw new DomainNotFoundException(ErrorMessages.INVITATION_NOT_FOUND);
    }

    if (invitation.isRevoked) {
      throw new DomainException(ErrorMessages.INVITATION_REVOKED);
    }

    if (invitation.acceptedAt) {
      throw new DomainException(ErrorMessages.INVITATION_ALREADY_ACCEPTED);
    }

    invitation.revoke();
    await this.staffInvitationRepository.save(invitation);
  }
}
