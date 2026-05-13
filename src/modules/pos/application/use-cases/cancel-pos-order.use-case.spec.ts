import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
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
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { CancelPosOrderUseCase } from './cancel-pos-order.use-case';

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

function createTestStaff(): { id: string; name: string } {
  return { id: 'staff-id-1', name: 'Test Staff' };
}

function createTestOrder(
  overrides: Partial<{
    id: string;
    channel: OrderChannel;
    status: OrderStatus;
    couponId: string | null;
  }> = {},
): Order {
  return Order.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    orderNumber: 'POS-0001',
    userId: null,
    staffId: 'staff-id-1',
    channel: overrides.channel ?? OrderChannel.POS,
    status: overrides.status ?? OrderStatus.PAID,
    paymentMethod: PaymentMethod.CASH,
    shippingMethod: ShippingMethod.PICKUP,
    subtotal: 10000,
    discount: 0,
    shippingCost: 0,
    total: 10000,
    couponId: overrides.couponId ?? null,
    couponCode: null,
    couponDiscount: null,
    shippingAddressSnapshot: null,
    customerName: 'Test Customer',
    customerEmail: '',
    customerPhone: null,
    customerDocType: null,
    customerDocNumber: null,
    notes: null,
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createTestItem(productId: string, quantity: number): OrderItem {
  return OrderItem.reconstitute({
    id: `item-${productId}`,
    orderId: 'order-id',
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

describe('CancelPosOrderUseCase', () => {
  let useCase: CancelPosOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelPosOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepo },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
      ],
    }).compile();

    useCase = module.get<CancelPosOrderUseCase>(CancelPosOrderUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ORDER_NOT_FOUND when order does not exist', async () => {
    const orderId = '99999999-9999-9999-9999-999999999999';
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no show' }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no show' }),
    ).rejects.toThrow(ErrorMessages.ORDER_NOT_FOUND);
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('should throw POS_ORDER_NOT_POS when channel is online', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, channel: OrderChannel.ONLINE });
    mockOrderRepo.findById.mockResolvedValue(order);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'wrong channel' }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'wrong channel' }),
    ).rejects.toThrow(ErrorMessages.POS_ORDER_NOT_POS);
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
  });

  it('should throw POS_ORDER_CANNOT_CANCEL when atomicStatusTransition returns false', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId });
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(false);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'late' }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'late' }),
    ).rejects.toThrow(ErrorMessages.POS_ORDER_CANNOT_CANCEL);
    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      orderId,
      OrderStatus.PAID,
      OrderStatus.CANCELLED,
    );
    expect(mockOrderRepo.atomicStockRestore).not.toHaveBeenCalled();
  });

  it('should restore stock for each item sorted by productId', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId });
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([
      createTestItem('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3),
      createTestItem('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
    ]);
    mockOrderRepo.atomicStockRestore.mockResolvedValue(undefined);

    await useCase.execute(createTestStaff(), orderId, { reason: 'cancel' });

    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.atomicStockRestore.mock.calls[0][0]).toBe(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    expect(mockOrderRepo.atomicStockRestore.mock.calls[0][1]).toBe(2);
    expect(mockOrderRepo.atomicStockRestore.mock.calls[1][0]).toBe(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    );
    expect(mockOrderRepo.atomicStockRestore.mock.calls[1][1]).toBe(3);
  });

  it('should decrement coupon uses when order had a coupon', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const couponId = 'coupon-id-1';
    const order = createTestOrder({ id: orderId, couponId });
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);
    mockCouponRepo.decrementUses.mockResolvedValue(undefined);

    await useCase.execute(createTestStaff(), orderId, { reason: 'cancel' });

    expect(mockCouponRepo.decrementUses).toHaveBeenCalledWith(couponId);
  });

  it('should NOT decrement coupon uses when order had no coupon', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, couponId: null });
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute(createTestStaff(), orderId, { reason: 'cancel' });

    expect(mockCouponRepo.decrementUses).not.toHaveBeenCalled();
  });

  it('should save order event with cancellation reason and staff name', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const staff = createTestStaff();
    const order = createTestOrder({ id: orderId });
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue([]);

    await useCase.execute(staff, orderId, { reason: 'cliente arrepentido' });

    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.orderId).toBe(orderId);
    expect(eventArg.status).toBe(OrderStatus.CANCELLED);
    expect(eventArg.description).toBe(
      `Venta anulada por ${staff.name}: cliente arrepentido`,
    );
    expect(eventArg.performedBy).toBe(staff.id);
  });
});
