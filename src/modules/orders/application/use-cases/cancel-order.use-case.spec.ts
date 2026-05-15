import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
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

import { CancelOrderUseCase } from './cancel-order.use-case';

const mockUnitOfWork = {
  execute: jest.fn(async (work: (ctx: unknown) => Promise<unknown>) => work({})),
};

const mockOrderRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findByIdWithDetails: jest.fn(),
  findAllByUserId: jest.fn(),
  findAll: jest.fn(),
  saveItem: jest.fn(),
  saveEvent: jest.fn(),
  findItemsByOrderId: jest.fn(),
  findEventsByOrderId: jest.fn(),
  atomicStatusTransition: jest.fn(),
  atomicStockDecrement: jest.fn(),
  atomicStockRestore: jest.fn(),
  findPendingExpired: jest.fn(),
  countUserOrdersWithCoupon: jest.fn(),
  delete: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockCouponRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  codeExists: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  findByIdForUpdate: jest.fn(),
  incrementUses: jest.fn(),
  decrementUses: jest.fn(),
  delete: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = 'customer-1';
const OTHER_USER_ID = 'customer-2';

function buildOrder(
  overrides: Partial<{
    id: string;
    userId: string | null;
    status: OrderStatus;
    couponId: string | null;
  }> = {},
): Order {
  return Order.reconstitute({
    id: overrides.id ?? ORDER_ID,
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
    total: 10000,
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

function buildItem(productId: string, quantity: number): OrderItem {
  return OrderItem.reconstitute({
    id: `item-${productId}`,
    orderId: ORDER_ID,
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

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepo },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
      ],
    }).compile();

    useCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('throws ORDER_NOT_FOUND when order does not exist', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      ErrorMessages.ORDER_NOT_FOUND,
    );
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('throws Forbidden when order belongs to another user', async () => {
    mockOrderRepo.findById.mockResolvedValue(
      buildOrder({ userId: OTHER_USER_ID }),
    );

    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      DomainForbiddenException,
    );
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('throws ORDER_CANNOT_CANCEL when atomicStatusTransition returns false (race or wrong status)', async () => {
    mockOrderRepo.findById.mockResolvedValue(buildOrder());
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(false);

    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(OWNER_ID, ORDER_ID)).rejects.toThrow(
      ErrorMessages.ORDER_CANNOT_CANCEL,
    );
    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      ORDER_ID,
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
    );
    expect(mockOrderRepo.atomicStockRestore).not.toHaveBeenCalled();
  });

  it('restores stock per item sorted by productId ASC (deadlock prevention)', async () => {
    mockOrderRepo.findById.mockResolvedValue(buildOrder());
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([
      buildItem('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3),
      buildItem('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
    ]);
    mockOrderRepo.atomicStockRestore.mockResolvedValue(undefined);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.atomicStockRestore.mock.calls[0][0]).toBe(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    expect(mockOrderRepo.atomicStockRestore.mock.calls[1][0]).toBe(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    );
  });

  it('decrements coupon uses when order had a coupon', async () => {
    mockOrderRepo.findById.mockResolvedValue(
      buildOrder({ couponId: 'coupon-1' }),
    );
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockCouponRepo.decrementUses).toHaveBeenCalledWith('coupon-1');
  });

  it('does NOT touch coupons when order had no coupon', async () => {
    mockOrderRepo.findById.mockResolvedValue(buildOrder({ couponId: null }));
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockCouponRepo.decrementUses).not.toHaveBeenCalled();
  });

  it('saves a CANCELLED order event after success', async () => {
    mockOrderRepo.findById.mockResolvedValue(buildOrder());
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute(OWNER_ID, ORDER_ID);

    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0];
    expect(eventArg.orderId).toBe(ORDER_ID);
    expect(eventArg.status).toBe(OrderStatus.CANCELLED);
  });
});
