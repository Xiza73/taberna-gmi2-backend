import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import { WishlistItemOrmEntity } from '../orm-entities/wishlist-item.orm-entity';

export class WishlistItemMapper {
  static toDomain(orm: WishlistItemOrmEntity): WishlistItem {
    return WishlistItem.reconstitute({
      id: orm.id,
      userId: orm.userId,
      productId: orm.productId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: WishlistItem): WishlistItemOrmEntity {
    const orm = new WishlistItemOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.productId = domain.productId;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
