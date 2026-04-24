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

@Injectable()
export class SuspendStaffMemberUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new DomainException(ErrorMessages.STAFF_CANNOT_SUSPEND_SELF);
    }

    const staff = await this.staffMemberRepository.findById(id);
    if (!staff) throw new DomainNotFoundException('StaffMember', id);

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
    await this.staffMemberRepository.save(staff);
  }
}
