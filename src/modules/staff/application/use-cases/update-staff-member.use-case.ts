import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface.js';
import { type UpdateStaffMemberDto } from '../dtos/update-staff-member.dto.js';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto.js';

@Injectable()
export class UpdateStaffMemberUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateStaffMemberDto,
  ): Promise<StaffMemberResponseDto> {
    const staff = await this.staffMemberRepository.findById(id);
    if (!staff) throw new DomainNotFoundException('StaffMember', id);

    staff.updateProfile({ name: dto.name });

    const saved = await this.staffMemberRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
