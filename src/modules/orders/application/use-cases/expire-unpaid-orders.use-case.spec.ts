import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '@shared/domain/interfaces/unit-of-work.interface';

import { COUPON_REPOSITORY } from '@modules/coupons/domain/interfaces/coupon-repository.interface';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderItem } from '@modules/orders/domain/entities/order-item.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { ExpireUnpaidOrdersUseCase } from './expire-unpaid-orders.use-case';

const mockUnitOfWork = {
  execute: jest.fn(async (work: (ctx: unknown) => Promise<unknown>) => work({})),
};

const mockOrderRepo = {
  findPendingExpired: jest.fn(),
  findItemsByOrderId: jest.fn(),
  atomicStatusTransition: jest.fn(),
  atomicStockRestore: jest.fn(),
  saveEvent: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockCouponRepo = {
  decrementUses: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockConfigService = {
  get: jest.fn((_: string, fallback?: unknown) => fallback ?? 2),
};

function buildOrder(
  id: string,
  overrides: Partial<{ couponId: string | null }> = {},
): Order {
  return Order.reconstitute({
    id,
    orderNumber: `ORD-${id.slice(0, 6)}`,
    userId: 'customer-1',
    staffId: null,
    channel: OrderChannel.ONLINE,
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.MERCADOPAGO,
    shippingMethod: ShippingMethod.STANDARD,
    subtotal: 5000,
    discount: 0,
    shippingCost: 0,
    total: 5000,
    couponId: overrides.couponId ?? null,
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

function buildItem(orderId: string, productId: string, quantity: number): OrderItem {
  return OrderItem.reconstitute({
    id: `item-${productId}`,
    orderId,
    productId,
    productName: 'Product',
    productSlug: 'product',
    productImage: null,
    unitPrice: 1000,
    quantity,
    subtotal: 1000 * quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ExpireUnpaidOrdersUseCase', () => {
  let useCase: ExpireUnpaidOrdersUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireUnpaidOrdersUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepo },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<ExpireUnpaidOrdersUseCase>(ExpireUnpaidOrdersUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns 0 when there are no expired orders', async () => {
    mockOrderRepo.findPendingExpired.mockResolvedValue([]);

    const expired = await useCase.execute();

    expect(expired).toBe(0);
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('uses ORDER_EXPIRATION_HOURS from config (default 2)', async () => {
    mockOrderRepo.findPendingExpired.mockResolvedValue([]);
    await useCase.execute();

    expect(mockConfigService.get).toHaveBeenCalledWith(
      'ORDER_EXPIRATION_HOURS',
      2,
    );
    const thresholdArg = mockOrderRepo.findPendingExpired.mock.calls[0][0];
    // threshold should be ~ now - 2h
    const now = Date.now();
    const expected = now - 2 * 60 * 60 * 1000;
    expect(Math.abs((thresholdArg as Date).getTime() - expected)).toBeLessThan(1500);
  });

  it('cancels each order, restores stock (sorted ASC), and saves event', async () => {
    const order = buildOrder('order-1');
    mockOrderRepo.findPendingExpired
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([]);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([
      buildItem('order-1', 'bbbb', 1),
      buildItem('order-1', 'aaaa', 2),
    ]);

    const expired = await useCase.execute();

    expect(expired).toBe(1);
    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
    );
    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.atomicStockRestore.mock.calls[0][0]).toBe('aaaa');
    expect(mockOrderRepo.atomicStockRestore.mock.calls[1][0]).toBe('bbbb');
    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
  });

  it('skips orders where atomicStatusTransition loses the race (e.g. webhook just paid)', async () => {
    const order = buildOrder('order-1');
    mockOrderRepo.findPendingExpired
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([]);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(false);

    const expired = await useCase.execute();

    expect(expired).toBe(0);
    expect(mockOrderRepo.findItemsByOrderId).not.toHaveBeenCalled();
    expect(mockOrderRepo.atomicStockRestore).not.toHaveBeenCalled();
    expect(mockOrderRepo.saveEvent).not.toHaveBeenCalled();
  });

  it('stops paginating when batch size returns less than batchSize', async () => {
    mockOrderRepo.findPendingExpired
      .mockResolvedValueOnce([buildOrder('order-1')])
      .mockResolvedValueOnce([]); // not actually reached because first < batchSize
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute();

    expect(mockOrderRepo.findPendingExpired).toHaveBeenCalledTimes(1);
  });
});
