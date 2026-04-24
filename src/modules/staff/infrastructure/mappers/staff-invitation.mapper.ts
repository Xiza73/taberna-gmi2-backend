import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { StaffInvitationOrmEntity } from '../orm-entities/staff-invitation.orm-entity';

export class StaffInvitationMapper {
  static toDomain(orm: StaffInvitationOrmEntity): StaffInvitation {
    return StaffInvitation.reconstitute({
      id: orm.id,
      email: orm.email,
      role: orm.role as StaffRole,
      tokenHash: orm.tokenHash,
      invitedBy: orm.invitedBy,
      expiresAt: orm.expiresAt,
      acceptedAt: orm.acceptedAt,
      isRevoked: orm.isRevoked,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: StaffInvitation): StaffInvitationOrmEntity {
    const orm = new StaffInvitationOrmEntity();
    orm.id = domain.id;
    orm.email = domain.email;
    orm.role = domain.role;
    orm.tokenHash = domain.tokenHash;
    orm.invitedBy = domain.invitedBy;
    orm.expiresAt = domain.expiresAt;
    orm.acceptedAt = domain.acceptedAt;
    orm.isRevoked = domain.isRevoked;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
