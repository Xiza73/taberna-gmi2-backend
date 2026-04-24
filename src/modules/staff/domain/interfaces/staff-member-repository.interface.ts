import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';
import { type StaffRole } from '@shared/domain/enums/staff-role.enum';

import { type StaffMember } from '../entities/staff-member.entity';

export const STAFF_MEMBER_REPOSITORY = Symbol('STAFF_MEMBER_REPOSITORY');

export interface IStaffMemberRepository extends IBaseRepository<StaffMember> {
  findByEmail(email: string): Promise<StaffMember | null>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    role?: StaffRole;
  }): Promise<{ items: StaffMember[]; total: number }>;
  countByRole(role: StaffRole, isActive: boolean): Promise<number>;
}
