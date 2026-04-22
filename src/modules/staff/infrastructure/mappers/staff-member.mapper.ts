import { StaffMember } from '../../domain/entities/staff-member.entity';
import { StaffMemberOrmEntity } from '../orm-entities/staff-member.orm-entity';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

export class StaffMemberMapper {
  static toDomain(orm: StaffMemberOrmEntity): StaffMember {
    return StaffMember.reconstitute({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      password: orm.password,
      role: orm.role as StaffRole,
      isActive: orm.isActive,
      invitedBy: orm.invitedBy,
      googleId: orm.googleId,
      resetPasswordToken: orm.resetPasswordToken,
      resetPasswordExpires: orm.resetPasswordExpires,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: StaffMember): StaffMemberOrmEntity {
    const orm = new StaffMemberOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email;
    orm.password = domain.password;
    orm.role = domain.role;
    orm.isActive = domain.isActive;
    orm.invitedBy = domain.invitedBy;
    orm.googleId = domain.googleId;
    orm.resetPasswordToken = domain.resetPasswordToken;
    orm.resetPasswordExpires = domain.resetPasswordExpires;
    return orm;
  }
}
