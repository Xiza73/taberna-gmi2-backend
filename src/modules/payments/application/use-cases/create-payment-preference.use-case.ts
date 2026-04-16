import { Inject, Injectable } from '@nestjs/common';

import { Payment } from '../../domain/entities/payment.entity.js';
import { PaymentStatus } from '../../domain/enums/payment-status.enum.js';
import {
  PAYMENT_REPOSITORY,
  type IPaymentRepository,
} from '../../domain/interfaces/payment-repository.interface.js';
import {
  PAYMENT_PROVIDER,
  type IPaymentProvider,
} from '../../domain/interfaces/payment-provider.interface.js';

@Injectable()
export class CreatePaymentPreferenceUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  async execute(order: {
    id: string;
    orderNumber: string;
    items: Array<{ title: string; quantity: number; unitPrice: number }>;
    total: number;
    payerEmail: string;
  }): Promise<{ preferenceId: string; paymentUrl: string }> {
    const { preferenceId, paymentUrl } =
      await this.paymentProvider.createPreference(order);

    const payment = Payment.create({
      orderId: order.id,
      preferenceId,
      status: PaymentStatus.PENDING,
      amount: order.total,
    });

    await this.paymentRepository.save(payment);

    return { preferenceId, paymentUrl };
  }
}
