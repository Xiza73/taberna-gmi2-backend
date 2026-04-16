import { Banner } from '../../domain/entities/banner.entity.js';
import { BannerOrmEntity } from '../orm-entities/banner.orm-entity.js';

export class BannerMapper {
  static toDomain(orm: BannerOrmEntity): Banner {
    return Banner.reconstitute({
      id: orm.id,
      title: orm.title,
      imageUrl: orm.imageUrl,
      linkUrl: orm.linkUrl,
      position: orm.position,
      isActive: orm.isActive,
      sortOrder: orm.sortOrder,
      startDate: orm.startDate,
      endDate: orm.endDate,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Banner): BannerOrmEntity {
    const orm = new BannerOrmEntity();
    orm.id = domain.id;
    orm.title = domain.title;
    orm.imageUrl = domain.imageUrl;
    orm.linkUrl = domain.linkUrl;
    orm.position = domain.position;
    orm.isActive = domain.isActive;
    orm.sortOrder = domain.sortOrder;
    orm.startDate = domain.startDate;
    orm.endDate = domain.endDate;
    return orm;
  }
}
