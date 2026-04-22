import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface IPaymentRepository extends IBaseRepository<Payment> {
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByExternalId(externalId: string): Promise<Payment | null>;
  upsertByExternalId(payment: Payment): Promise<Payment>;
}
