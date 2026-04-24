import { Inject, Injectable } from '@nestjs/common';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface';
import { type StaffQueryDto } from '../dtos/staff-query.dto';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';

@Injectable()
export class ListStaffMembersUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(
    query: StaffQueryDto,
  ): Promise<{ items: StaffMemberResponseDto[]; total: number }> {
    const { items, total } = await this.staffMemberRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      isActive: query.isActive,
      role: query.role,
    });

    return {
      items: items.map((staff) => new StaffMemberResponseDto(staff)),
      total,
    };
  }
}
