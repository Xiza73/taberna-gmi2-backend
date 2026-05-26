import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';

import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '@shared/domain/interfaces/unit-of-work.interface';

import { EMAIL_SENDER } from '@modules/notifications/domain/interfaces/email-sender.interface';
import { PAYMENT_PROVIDER } from '@modules/payments/domain/interfaces/payment-provider.interface';
import { PAYMENT_REPOSITORY } from '@modules/payments/domain/interfaces/payment-repository.interface';
import { PaymentStatus } from '@modules/payments/domain/enums/payment-status.enum';
import { Payment } from '@modules/payments/domain/entities/payment.entity';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { ProcessPaymentNotificationUseCase } from './process-payment-notification.use-case';

const mockUnitOfWork = {
  execute: jest.fn(async (work: (ctx: unknown) => Promise<unknown>) => work({})),
};
const mockOrderRepo = {
  findById: jest.fn(),
  atomicStatusTransition: jest.fn(),
  saveEvent: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};
const mockPaymentRepo = {
  findByExternalId: jest.fn(),
  upsertByExternalId: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};
const mockPaymentProvider = {
  getPaymentInfo: jest.fn(),
};
const mockEmailSender = {
  sendPaymentConfirmed: jest.fn().mockResolvedValue(undefined),
};
const SECRET = 's3cr3t-webhook';
const mockConfigService = {
  get: jest.fn((key: string, fallback?: unknown) => {
    if (key === 'MERCADOPAGO_WEBHOOK_SECRET') return SECRET;
    return fallback;
  }),
};

const ORDER_ID = '11111111-1111-1111-1111-111111111111';

function buildOrder(overrides: Partial<{ total: number; status: OrderStatus }> = {}): Order {
  return Order.reconstitute({
    id: ORDER_ID,
    orderNumber: 'ORD-0001',
    userId: 'customer-1',
    staffId: null,
    channel: OrderChannel.ONLINE,
    status: overrides.status ?? OrderStatus.PENDING,
    paymentMethod: PaymentMethod.MERCADOPAGO,
    shippingMethod: ShippingMethod.STANDARD,
    subtotal: 10000,
    discount: 0,
    shippingCost: 0,
    total: overrides.total ?? 10000,
    couponId: null,
    couponCode: null,
    couponDiscount: null,
    shippingAddressSnapshot: {
      street: 'Av. Test',
      city: 'Lima',
      department: 'Lima',
      recipientName: 'Tester',
    },
    customerName: 'Tester',
    customerEmail: 'tester@example.com',
    customerPhone: null,
    customerDocType: null,
    customerDocNumber: null,
    notes: null,
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function paymentInfo(overrides: Partial<{ status: string; amount: number; externalRef: string | undefined; externalId: string }> = {}) {
  return {
    externalId: overrides.externalId ?? 'mp-payment-1',
    status: overrides.status ?? 'approved',
    method: 'visa',
    paidAt: new Date(),
    transactionAmount: overrides.amount ?? 10000,
    rawResponse: {
      external_reference:
        overrides.externalRef !== undefined ? overrides.externalRef : ORDER_ID,
      preference_id: 'pref-1',
    } as Record<string, unknown>,
  };
}

describe('ProcessPaymentNotificationUseCase', () => {
  let useCase: ProcessPaymentNotificationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentNotificationUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepo },
        { provide: PAYMENT_PROVIDER, useValue: mockPaymentProvider },
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentNotificationUseCase>(
      ProcessPaymentNotificationUseCase,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute — short-circuit cases', () => {
    it('skips when payment is not approved', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(
        paymentInfo({ status: 'pending' }),
      );

      await useCase.execute('mp-payment-1');

      expect(mockPaymentRepo.findByExternalId).not.toHaveBeenCalled();
      expect(mockOrderRepo.findById).not.toHaveBeenCalled();
    });

    it('skips when payment already exists with APPROVED status (idempotency)', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(paymentInfo());
      mockPaymentRepo.findByExternalId.mockResolvedValue(
        Payment.create({
          orderId: ORDER_ID,
          status: PaymentStatus.APPROVED,
          amount: 10000,
        }),
      );

      await useCase.execute('mp-payment-1');

      expect(mockOrderRepo.findById).not.toHaveBeenCalled();
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
    });

    it('skips when payment has no external_reference', async () => {
      const info = paymentInfo();
      delete info.rawResponse.external_reference;
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(info);
      mockPaymentRepo.findByExternalId.mockResolvedValue(null);

      await useCase.execute('mp-payment-1');

      expect(mockOrderRepo.findById).not.toHaveBeenCalled();
    });

    it('skips when order is not found', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(paymentInfo());
      mockPaymentRepo.findByExternalId.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(null);

      await useCase.execute('mp-payment-1');

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
    });

    it('skips when payment amount does NOT match order total (potential fraud)', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(
        paymentInfo({ amount: 9999 }),
      );
      mockPaymentRepo.findByExternalId.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(buildOrder({ total: 10000 }));

      await useCase.execute('mp-payment-1');

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
    });
  });

  describe('execute — happy path', () => {
    it('upserts payment, transitions order to PAID, saves event, sends email', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(paymentInfo());
      mockPaymentRepo.findByExternalId.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(buildOrder());
      mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);

      await useCase.execute('mp-payment-1');

      expect(mockPaymentRepo.upsertByExternalId).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
        ORDER_ID,
        OrderStatus.PENDING,
        OrderStatus.PAID,
      );
      expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
      const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0];
      expect(eventArg.status).toBe(OrderStatus.PAID);
      expect(mockEmailSender.sendPaymentConfirmed).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute — late payment (order was already cancelled)', () => {
    it('upserts payment but logs late-payment event when transition fails', async () => {
      mockPaymentProvider.getPaymentInfo.mockResolvedValue(paymentInfo());
      mockPaymentRepo.findByExternalId.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(
        buildOrder({ status: OrderStatus.PENDING }),
      );
      mockOrderRepo.atomicStatusTransition.mockResolvedValue(false);

      await useCase.execute('mp-payment-1');

      expect(mockPaymentRepo.upsertByExternalId).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
      const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0];
      // Late payment event preserves the order's existing status, not PAID
      expect(eventArg.metadata).toEqual(
        expect.objectContaining({ latePayment: true }),
      );
      expect(mockEmailSender.sendPaymentConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('hasWebhookSecret', () => {
    it('returns true when MERCADOPAGO_WEBHOOK_SECRET is configured', () => {
      expect(useCase.hasWebhookSecret()).toBe(true);
    });
  });

  describe('verifySignature', () => {
    // Helper que arma firma igual que MP: lowercasea dataId, omite
    // segments si están vacíos, joina con ';' y termina con ';'.
    function buildSig(
      dataId: string | undefined,
      requestId: string | undefined,
      ts: number,
    ) {
      const segments: string[] = [];
      if (dataId) segments.push(`id:${dataId.toLowerCase()}`);
      if (requestId) segments.push(`request-id:${requestId}`);
      segments.push(`ts:${ts}`);
      const manifest = segments.join(';') + ';';
      const v1 = createHmac('sha256', SECRET).update(manifest).digest('hex');
      return `ts=${ts},v1=${v1}`;
    }

    it('returns true for a valid HMAC-SHA256 signature with the MP manifest format', () => {
      const ts = Math.floor(Date.now() / 1000);
      const sig = buildSig('payment-1', 'req-1', ts);
      expect(useCase.verifySignature('payment-1', 'req-1', sig)).toBe(true);
    });

    it('lowercasea dataId alfanumérico antes del HMAC', () => {
      const ts = Math.floor(Date.now() / 1000);
      // MP firma con el dataId en minúsculas; nuestro código debe matchear
      // aunque le pasemos el dataId en mayúsculas.
      const sig = buildSig('ORD-ABC-001', 'req-1', ts);
      expect(useCase.verifySignature('ORD-ABC-001', 'req-1', sig)).toBe(true);
    });

    it('returns false for a tampered signature', () => {
      const ts = Math.floor(Date.now() / 1000);
      const sig = buildSig('payment-1', 'req-1', ts);
      // tampered payment id — manifest no matchea
      expect(useCase.verifySignature('payment-2', 'req-1', sig)).toBe(false);
    });

    it('returns false for a malformed signature header', () => {
      expect(useCase.verifySignature('payment-1', 'req-1', 'not-a-valid-sig')).toBe(false);
    });

    it('returns false when signature header is missing', () => {
      expect(useCase.verifySignature('payment-1', 'req-1', undefined)).toBe(false);
    });

    it('omits empty segments from the manifest (per official MP SDK)', () => {
      const ts = Math.floor(Date.now() / 1000);
      // MP a veces envía webhooks sin data.id en query; el SDK oficial
      // arma el manifest sin el segmento `id:...`, no con `id:undefined;`.
      const sig = buildSig(undefined, 'req-1', ts);
      expect(useCase.verifySignature(undefined, 'req-1', sig)).toBe(true);
    });
  });
});
