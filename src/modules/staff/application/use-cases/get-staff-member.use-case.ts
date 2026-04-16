import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface.js';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto.js';

@Injectable()
export class GetStaffMemberUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(id: string): Promise<StaffMemberResponseDto> {
    const staff = await this.staffMemberRepository.findById(id);
    if (!staff) throw new DomainNotFoundException('StaffMember', id);
    return new StaffMemberResponseDto(staff);
  }
}
