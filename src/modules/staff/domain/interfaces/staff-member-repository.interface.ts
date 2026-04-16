import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type StaffMember } from '../entities/staff-member.entity.js';

export const STAFF_MEMBER_REPOSITORY = Symbol('STAFF_MEMBER_REPOSITORY');

export interface IStaffMemberRepository extends IBaseRepository<StaffMember> {
  findByEmail(email: string): Promise<StaffMember | null>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: StaffMember[]; total: number }>;
}
