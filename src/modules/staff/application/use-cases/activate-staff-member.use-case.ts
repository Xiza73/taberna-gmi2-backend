import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface.js';

@Injectable()
export class ActivateStaffMemberUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const staff = await this.staffMemberRepository.findById(id);
    if (!staff) throw new DomainNotFoundException('StaffMember', id);

    staff.activate();
    await this.staffMemberRepository.save(staff);
  }
}
