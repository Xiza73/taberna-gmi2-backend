import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

import { UNIT_OF_WORK, type IUnitOfWork, type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { PAYMENT_PROVIDER, type IPaymentProvider } from '@modules/payments/domain/interfaces/payment-provider.interface.js';
import { EMAIL_SENDER, type IEmailSender } from '@modules/notifications/domain/interfaces/email-sender.interface.js';
import { PAYMENT_REPOSITORY, type IPaymentRepository } from '@modules/payments/domain/interfaces/payment-repository.interface.js';
import { Payment } from '@modules/payments/domain/entities/payment.entity.js';
import { PaymentStatus } from '@modules/payments/domain/enums/payment-status.enum.js';

import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { OrderEvent } from '../../domain/entities/order-event.entity.js';
import { ORDER_REPOSITORY, type IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';

@Injectable()
export class ProcessPaymentNotificationUseCase {
  private readonly logger = new Logger(ProcessPaymentNotificationUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: IPaymentProvider,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  hasWebhookSecret(): boolean {
    const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET', '');
    return !!secret;
  }

  verifySignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET', '');
    if (!secret) return false;

    try {
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      const signatureHex = signature.replace('sha256=', '');
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHex, 'hex'));
    } catch {
      return false;
    }
  }

  async execute(paymentId: string): Promise<void> {
    // Get payment info from MercadoPago API
    const paymentInfo = await this.paymentProvider.getPaymentInfo(paymentId);

    if (paymentInfo.status !== 'approved') {
      this.logger.log(`Payment ${paymentId} status: ${paymentInfo.status} — skipping`);
      return;
    }

    // Idempotency: check if already processed
    const existingPayment = await this.paymentRepository.findByExternalId(paymentInfo.externalId);
    if (existingPayment && existingPayment.status === PaymentStatus.APPROVED) {
      this.logger.log(`Payment ${paymentInfo.externalId} already processed — skipping`);
      return;
    }

    // Find order by external_reference (which is the order id)
    const orderId = paymentInfo.rawResponse['external_reference'] as string | undefined;
    if (!orderId) {
      this.logger.warn(`Payment ${paymentId} has no external_reference`);
      return;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      this.logger.warn(`Order ${orderId} not found for payment ${paymentId}`);
      return;
    }

    // Verify amount
    if (paymentInfo.transactionAmount !== order.total) {
      this.logger.warn(`Payment amount mismatch: expected ${order.total}, got ${paymentInfo.transactionAmount} for order ${orderId}`);
      return;
    }

    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);
      const paymentRepo = this.paymentRepository.withTransaction(ctx);

      // Upsert payment record (handles duplicate webhooks)
      const payment = existingPayment ?? Payment.create({
        orderId: order.id,
        preferenceId: paymentInfo.rawResponse['preference_id'] as string ?? null,
        status: PaymentStatus.APPROVED,
        amount: paymentInfo.transactionAmount,
      });
      payment.updateFromProvider({
        externalId: paymentInfo.externalId,
        method: paymentInfo.method ?? undefined,
        status: PaymentStatus.APPROVED,
        paidAt: paymentInfo.paidAt ?? new Date(),
        rawResponse: paymentInfo.rawResponse,
      });
      await paymentRepo.upsertByExternalId(payment);

      // Atomic status transition
      const transitioned = await orderRepo.atomicStatusTransition(order.id, OrderStatus.PENDING, OrderStatus.PAID);

      if (transitioned) {
        const event = OrderEvent.create({
          orderId: order.id,
          status: OrderStatus.PAID,
          description: 'Pago confirmado via MercadoPago',
          metadata: { paymentId: paymentInfo.externalId },
        });
        await orderRepo.saveEvent(event);

        this.emailSender.sendPaymentConfirmed({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          email: order.customerEmail,
          total: order.total,
        }).catch(() => {});
      } else {
        // Late payment — order was already cancelled
        this.logger.warn(`Late payment for order ${orderId} — order is ${order.status}, payment approved`);
        const event = OrderEvent.create({
          orderId: order.id,
          status: order.status,
          description: 'Pago recibido post-cancelacion — requiere refund manual',
          metadata: { paymentId: paymentInfo.externalId, latePayment: true },
        });
        await orderRepo.saveEvent(event);
      }
    });
  }
}
