import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  STAFF_INVITATION_REPOSITORY,
  type IStaffInvitationRepository,
} from '../../domain/interfaces/staff-invitation-repository.interface';
import { type StaffInvitationQueryDto } from '../dtos/staff-invitation-query.dto';
import { StaffInvitationResponseDto } from '../dtos/staff-invitation-response.dto';

@Injectable()
export class ListInvitationsUseCase {
  constructor(
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
  ) {}

  async execute(
    query: StaffInvitationQueryDto,
  ): Promise<PaginatedResponseDto<StaffInvitationResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.staffInvitationRepository.findAll({
      page,
      limit,
      status: query.status,
    });

    return new PaginatedResponseDto(
      items.map((invitation) => new StaffInvitationResponseDto(invitation)),
      total,
      page,
      limit,
    );
  }
}
