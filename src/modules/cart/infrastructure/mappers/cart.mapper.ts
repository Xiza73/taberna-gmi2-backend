import { Cart } from '../../domain/entities/cart.entity.js';
import { CartOrmEntity } from '../orm-entities/cart.orm-entity.js';

export class CartMapper {
  static toDomain(orm: CartOrmEntity): Cart {
    return Cart.reconstitute({
      id: orm.id,
      userId: orm.userId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Cart): CartOrmEntity {
    const orm = new CartOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    return orm;
  }
}
