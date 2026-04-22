import { Address } from '../../domain/entities/address.entity';
import { AddressOrmEntity } from '../orm-entities/address.orm-entity';

export class AddressMapper {
  static toDomain(orm: AddressOrmEntity): Address {
    return Address.reconstitute({
      id: orm.id,
      userId: orm.userId,
      label: orm.label,
      recipientName: orm.recipientName,
      phone: orm.phone,
      street: orm.street,
      district: orm.district,
      city: orm.city,
      department: orm.department,
      zipCode: orm.zipCode,
      reference: orm.reference,
      isDefault: orm.isDefault,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Address): AddressOrmEntity {
    const orm = new AddressOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.label = domain.label;
    orm.recipientName = domain.recipientName;
    orm.phone = domain.phone;
    orm.street = domain.street;
    orm.district = domain.district;
    orm.city = domain.city;
    orm.department = domain.department;
    orm.zipCode = domain.zipCode;
    orm.reference = domain.reference;
    orm.isDefault = domain.isDefault;
    return orm;
  }
}
