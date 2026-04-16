import { CartItem } from '../../domain/entities/cart-item.entity.js';
import { CartItemOrmEntity } from '../orm-entities/cart-item.orm-entity.js';

export class CartItemMapper {
  static toDomain(orm: CartItemOrmEntity): CartItem {
    return CartItem.reconstitute({
      id: orm.id,
      cartId: orm.cartId,
      productId: orm.productId,
      quantity: orm.quantity,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: CartItem): CartItemOrmEntity {
    const orm = new CartItemOrmEntity();
    orm.id = domain.id;
    orm.cartId = domain.cartId;
    orm.productId = domain.productId;
    orm.quantity = domain.quantity;
    return orm;
  }
}
