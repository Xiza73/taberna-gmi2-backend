import { OrderEvent } from '../../domain/entities/order-event.entity.js';
import { OrderEventOrmEntity } from '../orm-entities/order-event.orm-entity.js';

export class OrderEventMapper {
  static toDomain(orm: OrderEventOrmEntity): OrderEvent {
    return OrderEvent.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      status: orm.status,
      description: orm.description,
      performedBy: orm.performedBy,
      metadata: orm.metadata,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: OrderEvent): OrderEventOrmEntity {
    const orm = new OrderEventOrmEntity();
    orm.id = domain.id;
    orm.orderId = domain.orderId;
    orm.status = domain.status;
    orm.description = domain.description;
    orm.performedBy = domain.performedBy;
    orm.metadata = domain.metadata;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
