import { UserRole } from '@shared/domain/enums/user-role.enum.js';

import { User } from '../../domain/entities/user.entity.js';
import { UserOrmEntity } from '../orm-entities/user.orm-entity.js';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      password: orm.password,
      phone: orm.phone,
      role: orm.role as UserRole,
      isActive: orm.isActive,
      resetPasswordToken: orm.resetPasswordToken,
      resetPasswordExpires: orm.resetPasswordExpires,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email;
    orm.password = domain.password;
    orm.phone = domain.phone;
    orm.role = domain.role;
    orm.isActive = domain.isActive;
    orm.resetPasswordToken = domain.resetPasswordToken;
    orm.resetPasswordExpires = domain.resetPasswordExpires;
    return orm;
  }
}
