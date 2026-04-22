import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface';
import { type UpdateStaffMemberDto } from '../dtos/update-staff-member.dto';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';

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
