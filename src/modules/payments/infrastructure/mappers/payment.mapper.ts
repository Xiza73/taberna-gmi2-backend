import { Payment } from '../../domain/entities/payment.entity.js';
import { PaymentOrmEntity } from '../orm-entities/payment.orm-entity.js';

export class PaymentMapper {
  static toDomain(orm: PaymentOrmEntity): Payment {
    return Payment.reconstitute({
      id: orm.id,
      orderId: orm.orderId,
      externalId: orm.externalId,
      preferenceId: orm.preferenceId,
      method: orm.method,
      status: orm.status,
      amount: orm.amount,
      paidAt: orm.paidAt,
      rawResponse: orm.rawResponse,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Payment): PaymentOrmEntity {
    const orm = new PaymentOrmEntity();
    orm.id = domain.id;
    orm.orderId = domain.orderId;
    orm.externalId = domain.externalId;
    orm.preferenceId = domain.preferenceId;
    orm.method = domain.method;
    orm.status = domain.status;
    orm.amount = domain.amount;
    orm.paidAt = domain.paidAt;
    orm.rawResponse = domain.rawResponse;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
