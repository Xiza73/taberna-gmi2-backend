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
    currentUserId: string,
    dto: UpdateStaffMemberDto,
  ): Promise<StaffMemberResponseDto> {
    const staff = await this.staffMemberRepository.findById(id);
    if (!staff) throw new DomainNotFoundException('StaffMember', id);

    if (dto.name !== undefined) {
      staff.updateProfile({ name: dto.name });
    }

    if (dto.role !== undefined) {
      if (id === currentUserId) {
        throw new DomainException(ErrorMessages.STAFF_CANNOT_CHANGE_OWN_ROLE);
      }
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
    }

    if (dto.isActive !== undefined && dto.isActive !== staff.isActive) {
      if (!dto.isActive) {
        if (id === currentUserId) {
          throw new DomainException(ErrorMessages.STAFF_CANNOT_SUSPEND_SELF);
        }
        if (staff.role === StaffRole.SUPER_ADMIN) {
          const count = await this.staffMemberRepository.countByRole(
            StaffRole.SUPER_ADMIN,
            true,
          );
          if (count <= 1) {
            throw new DomainException(ErrorMessages.STAFF_LAST_SUPER_ADMIN);
          }
        }
        staff.suspend();
      } else {
        staff.activate();
      }
    }

    const saved = await this.staffMemberRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
