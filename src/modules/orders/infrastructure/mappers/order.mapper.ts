import { Order } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from '../orm-entities/order.orm-entity';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    return Order.reconstitute({
      id: orm.id,
      orderNumber: orm.orderNumber,
      userId: orm.userId,
      staffId: orm.staffId,
      channel: orm.channel,
      status: orm.status,
      paymentMethod: orm.paymentMethod,
      shippingMethod: orm.shippingMethod,
      subtotal: orm.subtotal,
      discount: orm.discount,
      shippingCost: orm.shippingCost,
      total: orm.total,
      couponId: orm.couponId,
      couponCode: orm.couponCode,
      couponDiscount: orm.couponDiscount,
      shippingAddressSnapshot: orm.shippingAddressSnapshot,
      customerName: orm.customerName,
      customerEmail: orm.customerEmail,
      customerPhone: orm.customerPhone,
      customerDocType: orm.customerDocType,
      customerDocNumber: orm.customerDocNumber,
      notes: orm.notes,
      adminNotes: orm.adminNotes,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Order): OrderOrmEntity {
    const orm = new OrderOrmEntity();
    orm.id = domain.id;
    orm.orderNumber = domain.orderNumber;
    orm.userId = domain.userId;
    orm.staffId = domain.staffId;
    orm.channel = domain.channel;
    orm.status = domain.status;
    orm.paymentMethod = domain.paymentMethod;
    orm.shippingMethod = domain.shippingMethod;
    orm.subtotal = domain.subtotal;
    orm.discount = domain.discount;
    orm.shippingCost = domain.shippingCost;
    orm.total = domain.total;
    orm.couponId = domain.couponId;
    orm.couponCode = domain.couponCode;
    orm.couponDiscount = domain.couponDiscount;
    orm.shippingAddressSnapshot = domain.shippingAddressSnapshot;
    orm.customerName = domain.customerName;
    orm.customerEmail = domain.customerEmail;
    orm.customerPhone = domain.customerPhone;
    orm.customerDocType = domain.customerDocType;
    orm.customerDocNumber = domain.customerDocNumber;
    orm.notes = domain.notes;
    orm.adminNotes = domain.adminNotes;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
