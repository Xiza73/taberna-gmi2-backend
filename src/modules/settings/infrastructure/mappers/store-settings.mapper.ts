import { StoreSettings } from '../../domain/entities/store-settings.entity';
import { StoreSettingsOrmEntity } from '../orm-entities/store-settings.orm-entity';

export class StoreSettingsMapper {
  static toDomain(orm: StoreSettingsOrmEntity): StoreSettings {
    return StoreSettings.reconstitute({
      id: orm.id,
      storeName: orm.storeName,
      legalName: orm.legalName,
      address: orm.address,
      district: orm.district,
      city: orm.city,
      phone: orm.phone,
      email: orm.email,
      ruc: orm.ruc,
      currency: orm.currency,
      igvPercentage: Number(orm.igvPercentage),
      logoUrl: orm.logoUrl,
      faviconUrl: orm.faviconUrl,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: StoreSettings): StoreSettingsOrmEntity {
    const orm = new StoreSettingsOrmEntity();
    orm.id = domain.id;
    orm.storeName = domain.storeName;
    orm.legalName = domain.legalName;
    orm.address = domain.address;
    orm.district = domain.district;
    orm.city = domain.city;
    orm.phone = domain.phone;
    orm.email = domain.email;
    orm.ruc = domain.ruc;
    orm.currency = domain.currency;
    orm.igvPercentage = domain.igvPercentage;
    orm.logoUrl = domain.logoUrl;
    orm.faviconUrl = domain.faviconUrl;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
