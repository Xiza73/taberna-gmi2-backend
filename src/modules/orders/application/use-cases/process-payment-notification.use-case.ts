import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

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
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface';
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

@Injectable()
export class ProcessPaymentNotificationUseCase {
  private readonly logger = new Logger(ProcessPaymentNotificationUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  hasWebhookSecret(): boolean {
    const secret = this.configService.get<string>(
      'MERCADOPAGO_WEBHOOK_SECRET',
      '',
    );
    return !!secret;
  }

  /**
   * Verifica firma HMAC del webhook de MercadoPago.
   *
   * Implementación idéntica al SDK oficial de MercadoPago Node.js
   * (`mercadopago/.../webhook/index.ts`). Diferencias importantes vs
   * implementaciones naive:
   *
   * 1. `dataId.toLowerCase()` — la spec MP indica que el dataId va en
   *    minúsculas (los IDs alfanuméricos como ORDxxx hay que bajarlos).
   * 2. Manifest condicional — si `dataId` o `requestId` están vacíos,
   *    se OMITE el segmento entero, no se pone `id:undefined;`.
   * 3. Parseo del x-signature itera todos los pares, no asume orden.
   * 4. Trim de keys y values al parsear (MP a veces incluye espacios).
   * 5. timingSafeEqual para evitar timing attacks.
   *
   * Header recibido:
   *   x-signature:  ts=<unix_seconds>,v1=<hex_hmac>
   *   x-request-id: <uuid>
   *
   * Manifest (segmentos opcionales se omiten si están vacíos):
   *   id:<data.id_lowercased>;request-id:<x-request-id>;ts:<ts>;
   *
   * HMAC-SHA256(webhook_secret_string, manifest) → comparar con v1.
   *
   * Docs: https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
   * SDK ref: https://github.com/mercadopago/sdk-nodejs/blob/master/src/utils/webhook/index.ts
   */
  verifySignature(
    dataId: string | undefined,
    requestId: string | undefined,
    signatureHeader: string | undefined,
  ): boolean {
    const secret = this.configService.get<string>(
      'MERCADOPAGO_WEBHOOK_SECRET',
      '',
    );
    if (!secret) return false;
    if (!signatureHeader) return false;

    try {
      // Parsear x-signature: itera todos los pares (no asume orden),
      // hace trim de keys y values.
      const parts = signatureHeader.split(',');
      let ts: string | undefined;
      let v1: string | undefined;
      for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) continue;
        const key = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1).trim();
        if (key === 'ts') ts = value;
        else if (key === 'v1') v1 = value;
      }
      if (!ts || !v1) {
        this.logger.warn('x-signature header malformed (missing ts or v1)');
        return false;
      }
      if (!/^\d+$/.test(ts)) {
        this.logger.warn(`x-signature ts is not numeric: ${ts}`);
        return false;
      }

      // Build manifest segments condicionalmente (omite si están vacíos).
      // dataId se lowercasea (spec MP para IDs alfanuméricos).
      const segments: string[] = [];
      if (dataId) {
        segments.push(`id:${String(dataId).toLowerCase()}`);
      }
      if (requestId) {
        segments.push(`request-id:${requestId}`);
      }
      segments.push(`ts:${ts}`);
      const manifest = segments.join(';') + ';';

      const expected = createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'hex');
      const actualBuf = Buffer.from(v1, 'hex');
      if (expectedBuf.length !== actualBuf.length) {
        this.logger.warn(
          `HMAC length mismatch: expected=${expectedBuf.length} actual=${actualBuf.length}`,
        );
        return false;
      }
      const matches = timingSafeEqual(expectedBuf, actualBuf);
      if (!matches) {
        this.logger.warn(
          `HMAC mismatch — manifest=${manifest} expected=${expected} got=${v1}`,
        );
      }
      return matches;
    } catch (err) {
      this.logger.warn(
        `Signature verification threw: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  async execute(paymentId: string): Promise<void> {
    // Get payment info from MercadoPago API
    const paymentInfo = await this.paymentProvider.getPaymentInfo(paymentId);

    if (paymentInfo.status !== 'approved') {
      this.logger.log(
        `Payment ${paymentId} status: ${paymentInfo.status} — skipping`,
      );
      return;
    }

    // Idempotency: check if already processed
    const existingPayment = await this.paymentRepository.findByExternalId(
      paymentInfo.externalId,
    );
    if (existingPayment && existingPayment.status === PaymentStatus.APPROVED) {
      this.logger.log(
        `Payment ${paymentInfo.externalId} already processed — skipping`,
      );
      return;
    }

    // Find order by external_reference (which is the order id)
    const orderId = paymentInfo.rawResponse['external_reference'] as
      | string
      | undefined;
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
      this.logger.warn(
        `Payment amount mismatch: expected ${order.total}, got ${paymentInfo.transactionAmount} for order ${orderId}`,
      );
      return;
    }

    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);
      const paymentRepo = this.paymentRepository.withTransaction(ctx);

      // Upsert payment record (handles duplicate webhooks)
      const payment =
        existingPayment ??
        Payment.create({
          orderId: order.id,
          preferenceId:
            (paymentInfo.rawResponse['preference_id'] as string) ?? null,
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
      const transitioned = await orderRepo.atomicStatusTransition(
        order.id,
        OrderStatus.PENDING,
        OrderStatus.PAID,
      );

      if (transitioned) {
        const event = OrderEvent.create({
          orderId: order.id,
          status: OrderStatus.PAID,
          description: 'Pago confirmado via MercadoPago',
          metadata: { paymentId: paymentInfo.externalId },
        });
        await orderRepo.saveEvent(event);

        this.emailSender
          .sendPaymentConfirmed({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            email: order.customerEmail,
            total: order.total,
          })
          .catch(() => {});
      } else {
        // Late payment — order was already cancelled
        this.logger.warn(
          `Late payment for order ${orderId} — order is ${order.status}, payment approved`,
        );
        const event = OrderEvent.create({
          orderId: order.id,
          status: order.status,
          description:
            'Pago recibido post-cancelacion — requiere refund manual',
          metadata: { paymentId: paymentInfo.externalId, latePayment: true },
        });
        await orderRepo.saveEvent(event);
      }
    });
  }
}
