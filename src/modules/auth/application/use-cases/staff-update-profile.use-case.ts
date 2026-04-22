import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface';
import { StaffMemberResponseDto } from '../../../staff/application/dtos/staff-member-response.dto';

@Injectable()
export class StaffUpdateProfileUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(
    staffId: string,
    dto: { name?: string },
  ): Promise<StaffMemberResponseDto> {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff)
      throw new DomainNotFoundException(ErrorMessages.STAFF_NOT_FOUND);

    staff.updateProfile({ name: dto.name });
    const saved = await this.staffRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
