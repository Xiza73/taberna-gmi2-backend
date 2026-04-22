import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
  type TransactionContext,
} from '@shared/domain/interfaces/unit-of-work.interface';

import {
  PAYMENT_PROVIDER,
  type IPaymentProvider,
} from '@modules/payments/domain/interfaces/payment-provider.interface';
import {
  PAYMENT_REPOSITORY,
  type IPaymentRepository,
} from '@modules/payments/domain/interfaces/payment-repository.interface';
import { Payment } from '@modules/payments/domain/entities/payment.entity';
import { PaymentStatus } from '@modules/payments/domain/enums/payment-status.enum';

import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderEvent } from '../../domain/entities/order-event.entity';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class VerifyPaymentUseCase {
  private readonly logger = new Logger(VerifyPaymentUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(userId: string, orderId: string): Promise<OrderResponseDto> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (result.order.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ORDER_NOT_FOUND);
    }

    // Already paid — return current state
    if (result.order.status !== OrderStatus.PENDING) {
      return new OrderResponseDto(result.order, {
        items: result.items,
        events: result.events,
      });
    }

    // Query MercadoPago by order id (external_reference)
    const payments = await this.paymentProvider.getPreferencePayments(
      result.order.id,
    );
    const approvedPayment = payments.find((p) => p.status === 'approved');

    if (!approvedPayment) {
      return new OrderResponseDto(result.order, {
        items: result.items,
        events: result.events,
      });
    }

    // Verify amount
    if (approvedPayment.transactionAmount !== result.order.total) {
      this.logger.warn(
        `Payment amount mismatch on verify: expected ${result.order.total}, got ${approvedPayment.transactionAmount}`,
      );
      return new OrderResponseDto(result.order, {
        items: result.items,
        events: result.events,
      });
    }

    // Process the payment within transaction
    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);
      const paymentRepo = this.paymentRepository.withTransaction(ctx);

      const payment = Payment.create({
        orderId: result.order.id,
        status: PaymentStatus.APPROVED,
        amount: approvedPayment.transactionAmount,
      });
      payment.updateFromProvider({
        externalId: approvedPayment.externalId,
        method: approvedPayment.method ?? undefined,
        status: PaymentStatus.APPROVED,
        paidAt: approvedPayment.paidAt ?? new Date(),
        rawResponse: approvedPayment.rawResponse,
      });
      await paymentRepo.upsertByExternalId(payment);

      const transitioned = await orderRepo.atomicStatusTransition(
        result.order.id,
        OrderStatus.PENDING,
        OrderStatus.PAID,
      );
      if (transitioned) {
        const event = OrderEvent.create({
          orderId: result.order.id,
          status: OrderStatus.PAID,
          description: 'Pago verificado manualmente',
          metadata: { paymentId: approvedPayment.externalId },
        });
        await orderRepo.saveEvent(event);
      }
    });

    // Return updated order
    const updated = await this.orderRepository.findByIdWithDetails(orderId);
    return new OrderResponseDto(updated!.order, {
      items: updated!.items,
      events: updated!.events,
    });
  }
}
