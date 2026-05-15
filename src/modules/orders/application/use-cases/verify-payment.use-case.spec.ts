import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '@shared/domain/interfaces/unit-of-work.interface';

import { PAYMENT_PROVIDER } from '@modules/payments/domain/interfaces/payment-provider.interface';
import { PAYMENT_REPOSITORY } from '@modules/payments/domain/interfaces/payment-repository.interface';
import { PaymentStatus } from '@modules/payments/domain/enums/payment-status.enum';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { VerifyPaymentUseCase } from './verify-payment.use-case';

const mockUnitOfWork = {
  execute: jest.fn(async (work: (ctx: unknown) => Promise<unknown>) => work({})),
};

const mockOrderRepo = {
  findByIdWithDetails: jest.fn(),
  atomicStatusTransition: jest.fn(),
  saveEvent: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockPaymentRepo = {
  upsertByExternalId: jest.fn(),
  findByExternalId: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockPaymentProvider = {
  createPreference: jest.fn(),
  getPaymentInfo: jest.fn(),
  getPreferencePayments: jest.fn(),
  verifySignature: jest.fn(),
  hasWebhookSecret: jest.fn(),
};

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = 'customer-1';
const OTHER_USER_ID = 'customer-2';

function buildOrder(
  overrides: Partial<{
    userId: string | null;
    status: OrderStatus;
    total: number;
  }> = {},
): Order {
  return Order.reconstitute({
    id: ORDER_ID,
    orderNumber: 'ORD-0001',
    userId: overrides.userId === undefined ? OWNER_ID : overrides.userId,
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

function buildDetails(order: Order) {
  return { order, items: [], events: [] };
}

function approvedPaymentInfo(amount = 10000) {
  return {
    externalId: 'mp-payment-1',
    status: 'approved' as const,
    method: 'visa',
    paidAt: new Date(),
    transactionAmount: amount,
    rawResponse: {},
  };
}

describe('VerifyPaymentUseCase', () => {
  let useCase: VerifyPaymentUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyPaymentUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepo },
        { provide: PAYMENT_PROVIDER, useValue: mockPaymentProvider },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
      ],
    }).compile();

    useCase = module.get<VerifyPaymentUseCase>(VerifyPaymentUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('throws ORDER_NOT_FOUND when order does not exist', async () => {
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(null);

    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      ErrorMessages.ORDER_NOT_FOUND,
    );
    expect(mockPaymentProvider.getPreferencePayments).not.toHaveBeenCalled();
  });

  it('throws Forbidden when order belongs to another user', async () => {
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(
      buildDetails(buildOrder({ userId: OTHER_USER_ID })),
    );

    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      DomainForbiddenException,
    );
    expect(mockPaymentProvider.getPreferencePayments).not.toHaveBeenCalled();
  });

  it('returns current state without calling MP when already paid', async () => {
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(
      buildDetails(buildOrder({ status: OrderStatus.PAID })),
    );

    const result = await useCase.execute(OWNER_ID, ORDER_ID);

    expect(result).toBeDefined();
    expect(mockPaymentProvider.getPreferencePayments).not.toHaveBeenCalled();
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('returns current state when MP has no approved payment yet', async () => {
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(
      buildDetails(buildOrder()),
    );
    mockPaymentProvider.getPreferencePayments.mockResolvedValue([
      { ...approvedPaymentInfo(), status: 'pending' },
    ]);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
    expect(mockPaymentRepo.upsertByExternalId).not.toHaveBeenCalled();
  });

  it('does NOT mark as paid when amount mismatches order total', async () => {
    const order = buildOrder({ total: 10000 });
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(buildDetails(order));
    mockPaymentProvider.getPreferencePayments.mockResolvedValue([
      approvedPaymentInfo(9999), // mismatch
    ]);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
    expect(mockPaymentRepo.upsertByExternalId).not.toHaveBeenCalled();
  });

  it('upserts payment and transitions to PAID when MP says approved with matching amount', async () => {
    const order = buildOrder({ total: 10000 });
    mockOrderRepo.findByIdWithDetails
      .mockResolvedValueOnce(buildDetails(order))
      .mockResolvedValueOnce(
        buildDetails(buildOrder({ status: OrderStatus.PAID })),
      );
    mockPaymentProvider.getPreferencePayments.mockResolvedValue([
      approvedPaymentInfo(10000),
    ]);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockPaymentRepo.upsertByExternalId).toHaveBeenCalledTimes(1);
    const paymentArg = mockPaymentRepo.upsertByExternalId.mock.calls[0][0];
    expect(paymentArg.status).toBe(PaymentStatus.APPROVED);
    expect(paymentArg.amount).toBe(10000);

    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      ORDER_ID,
      OrderStatus.PENDING,
      OrderStatus.PAID,
    );
    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
  });

  it('does NOT create an OrderEvent when atomic transition loses the race', async () => {
    const order = buildOrder({ total: 10000 });
    mockOrderRepo.findByIdWithDetails
      .mockResolvedValueOnce(buildDetails(order))
      .mockResolvedValueOnce(
        buildDetails(buildOrder({ status: OrderStatus.PAID })),
      );
    mockPaymentProvider.getPreferencePayments.mockResolvedValue([
      approvedPaymentInfo(10000),
    ]);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(false);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockPaymentRepo.upsertByExternalId).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.saveEvent).not.toHaveBeenCalled();
  });
});
