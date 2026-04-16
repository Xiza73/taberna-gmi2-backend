import { StaffMember } from '../../domain/entities/staff-member.entity.js';
import { StaffMemberOrmEntity } from '../orm-entities/staff-member.orm-entity.js';

export class StaffMemberMapper {
  static toDomain(orm: StaffMemberOrmEntity): StaffMember {
    return StaffMember.reconstitute({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      password: orm.password,
      isActive: orm.isActive,
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
    orm.isActive = domain.isActive;
    return orm;
  }
}
