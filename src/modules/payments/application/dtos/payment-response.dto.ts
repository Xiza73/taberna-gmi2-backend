import { type Payment } from '../../domain/entities/payment.entity.js';

export class PaymentResponseDto {
  id: string;
  orderId: string;
  externalId: string | null;
  preferenceId: string | null;
  method: string | null;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.orderId = payment.orderId;
    this.externalId = payment.externalId;
    this.preferenceId = payment.preferenceId;
    this.method = payment.method;
    this.status = payment.status;
    this.amount = payment.amount;
    this.paidAt = payment.paidAt?.toISOString() ?? null;
    this.createdAt = payment.createdAt.toISOString();
    this.updatedAt = payment.updatedAt.toISOString();
  }
}
