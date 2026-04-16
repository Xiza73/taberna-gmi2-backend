import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderItemOrmEntity } from '../orm-entities/order-item.orm-entity.js';

export class OrderItemMapper {
  static toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItem.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      productId: orm.productId,
      productName: orm.productName,
      productSlug: orm.productSlug,
      productImage: orm.productImage,
      unitPrice: orm.unitPrice,
      quantity: orm.quantity,
      subtotal: orm.subtotal,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: OrderItem): OrderItemOrmEntity {
    const orm = new OrderItemOrmEntity();
    orm.id = domain.id;
    orm.orderId = domain.orderId;
    orm.productId = domain.productId;
    orm.productName = domain.productName;
    orm.productSlug = domain.productSlug;
    orm.productImage = domain.productImage;
    orm.unitPrice = domain.unitPrice;
    orm.quantity = domain.quantity;
    orm.subtotal = domain.subtotal;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
