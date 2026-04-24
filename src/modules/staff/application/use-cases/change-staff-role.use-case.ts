import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface';
import { type ChangeStaffRoleDto } from '../dtos/change-staff-role.dto';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';

@Injectable()
export class ChangeStaffRoleUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(
    targetId: string,
    currentUserId: string,
    dto: ChangeStaffRoleDto,
  ): Promise<StaffMemberResponseDto> {
    if (targetId === currentUserId) {
      throw new DomainException(ErrorMessages.STAFF_CANNOT_CHANGE_OWN_ROLE);
    }

    const staff = await this.staffMemberRepository.findById(targetId);
    if (!staff) throw new DomainNotFoundException('StaffMember', targetId);

    if (
      staff.role === StaffRole.SUPER_ADMIN &&
      dto.role !== StaffRole.SUPER_ADMIN
    ) {
      const count = await this.staffMemberRepository.countByRole(
        StaffRole.SUPER_ADMIN,
        true,
      );
      if (count <= 1) {
        throw new DomainException(ErrorMessages.STAFF_LAST_SUPER_ADMIN);
      }
    }

    staff.changeRole(dto.role);

    const saved = await this.staffMemberRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
