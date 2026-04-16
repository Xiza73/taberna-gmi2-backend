import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface.js';
import { StaffMemberResponseDto } from '../../../staff/application/dtos/staff-member-response.dto.js';

@Injectable()
export class StaffGetMeUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(staffId: string): Promise<StaffMemberResponseDto> {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff) throw new DomainNotFoundException('StaffMember', staffId);
    return new StaffMemberResponseDto(staff);
  }
}
