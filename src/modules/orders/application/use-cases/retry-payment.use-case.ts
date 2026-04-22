import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  PAYMENT_PROVIDER,
  type IPaymentProvider,
} from '@modules/payments/domain/interfaces/payment-provider.interface';

import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';

@Injectable()
export class RetryPaymentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  async execute(
    userId: string,
    orderId: string,
  ): Promise<{ paymentUrl: string }> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (result.order.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (result.order.status !== OrderStatus.PENDING) {
      throw new DomainException(ErrorMessages.ORDER_NOT_PENDING_PAYMENT);
    }

    const preference = await this.paymentProvider.createPreference({
      id: result.order.id,
      orderNumber: result.order.orderNumber,
      items: result.items.map((i) => ({
        title: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total: result.order.total,
      payerEmail: result.order.customerEmail,
    });

    return { paymentUrl: preference.paymentUrl };
  }
}
