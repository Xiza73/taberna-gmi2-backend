import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type StaffInvitation } from '../entities/staff-invitation.entity';

export const STAFF_INVITATION_REPOSITORY = Symbol('STAFF_INVITATION_REPOSITORY');

export interface IStaffInvitationRepository
  extends IBaseRepository<StaffInvitation> {
  findPendingByEmail(email: string): Promise<StaffInvitation | null>;
  findAll(params: {
    page: number;
    limit: number;
    status?: 'pending' | 'accepted' | 'expired' | 'revoked';
  }): Promise<{ items: StaffInvitation[]; total: number }>;
}
