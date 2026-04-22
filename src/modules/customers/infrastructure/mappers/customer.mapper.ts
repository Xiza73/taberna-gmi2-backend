import { Customer } from '../../domain/entities/customer.entity';
import { CustomerOrmEntity } from '../orm-entities/customer.orm-entity';

export class CustomerMapper {
  static toDomain(orm: CustomerOrmEntity): Customer {
    return Customer.reconstitute({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      password: orm.password,
      phone: orm.phone,
      isActive: orm.isActive,
      resetPasswordToken: orm.resetPasswordToken,
      resetPasswordExpires: orm.resetPasswordExpires,
      googleId: orm.googleId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Customer): CustomerOrmEntity {
    const orm = new CustomerOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email;
    orm.password = domain.password;
    orm.phone = domain.phone;
    orm.isActive = domain.isActive;
    orm.resetPasswordToken = domain.resetPasswordToken;
    orm.resetPasswordExpires = domain.resetPasswordExpires;
    orm.googleId = domain.googleId;
    return orm;
  }
}
