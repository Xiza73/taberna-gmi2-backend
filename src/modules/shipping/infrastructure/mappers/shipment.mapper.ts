import { Shipment } from '../../domain/entities/shipment.entity';
import { ShipmentOrmEntity } from '../orm-entities/shipment.orm-entity';

export class ShipmentMapper {
  static toDomain(orm: ShipmentOrmEntity): Shipment {
    return Shipment.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      carrier: orm.carrier,
      trackingNumber: orm.trackingNumber,
      trackingUrl: orm.trackingUrl,
      status: orm.status,
      shippedAt: orm.shippedAt,
      deliveredAt: orm.deliveredAt,
      notes: orm.notes,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Shipment): ShipmentOrmEntity {
    const orm = new ShipmentOrmEntity();
    orm.id = domain.id;
    orm.orderId = domain.orderId;
    orm.carrier = domain.carrier;
    orm.trackingNumber = domain.trackingNumber;
    orm.trackingUrl = domain.trackingUrl;
    orm.status = domain.status;
    orm.shippedAt = domain.shippedAt;
    orm.deliveredAt = domain.deliveredAt;
    orm.notes = domain.notes;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
