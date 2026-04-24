import { Inject, Injectable } from '@nestjs/common';

import { STAFF_INVITATION_REPOSITORY, type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitationResponseDto } from '../dtos/staff-invitation-response.dto';

@Injectable()
export class ListInvitationsUseCase {
  constructor(
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
  ) {}

  async execute(query: {
    page?: number;
    limit?: number;
  }): Promise<{ items: StaffInvitationResponseDto[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { items, total } = await this.staffInvitationRepository.findAll({
      page,
      limit,
    });

    return {
      items: items.map((invitation) => new StaffInvitationResponseDto(invitation)),
      total,
    };
  }
}
