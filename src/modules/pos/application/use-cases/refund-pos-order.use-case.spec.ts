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

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderItem } from '@modules/orders/domain/entities/order-item.entity';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { RefundPosOrderUseCase } from './refund-pos-order.use-case';

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

function createTestStaff(): { id: string; name: string } {
  return { id: 'staff-id-1', name: 'Test Staff' };
}

function createTestOrder(
  overrides: Partial<{
    id: string;
    channel: OrderChannel;
    status: OrderStatus;
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
    couponId: null,
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

function createTestItem(
  id: string,
  productId: string,
  quantity: number,
  productName = 'Product',
): OrderItem {
  return OrderItem.reconstitute({
    id,
    orderId: 'order-id',
    productId,
    productName,
    productSlug: 'product',
    productImage: null,
    unitPrice: 1000,
    quantity,
    subtotal: 1000 * quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('RefundPosOrderUseCase', () => {
  let useCase: RefundPosOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundPosOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
      ],
    }).compile();

    useCase = module.get<RefundPosOrderUseCase>(RefundPosOrderUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ORDER_NOT_FOUND when order does not exist', async () => {
    const orderId = '99999999-9999-9999-9999-999999999999';
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'wrong item' }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'wrong item' }),
    ).rejects.toThrow(ErrorMessages.ORDER_NOT_FOUND);
  });

  it('should throw POS_ORDER_NOT_POS when channel is online', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({
      id: orderId,
      channel: OrderChannel.ONLINE,
    });
    mockOrderRepo.findById.mockResolvedValue(order);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no' }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no' }),
    ).rejects.toThrow(ErrorMessages.POS_ORDER_NOT_POS);
  });

  it('should throw POS_ORDER_CANNOT_REFUND when status is not paid or processing', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({
      id: orderId,
      status: OrderStatus.PENDING,
    });
    mockOrderRepo.findById.mockResolvedValue(order);

    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no' }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), orderId, { reason: 'no' }),
    ).rejects.toThrow(ErrorMessages.POS_ORDER_CANNOT_REFUND);
    expect(mockOrderRepo.atomicStockRestore).not.toHaveBeenCalled();
  });

  it('should perform full refund when items array is empty/undefined', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, status: OrderStatus.PAID });
    const items = [
      createTestItem(
        'item-1',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        2,
        'Product A',
      ),
      createTestItem(
        'item-2',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        3,
        'Product B',
      ),
    ];
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue(items);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);

    await useCase.execute(createTestStaff(), orderId, { reason: 'broken' });

    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      orderId,
      OrderStatus.PAID,
      OrderStatus.REFUNDED,
    );
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.status).toBe(OrderStatus.REFUNDED);
    expect(eventArg.metadata).toEqual({
      refundType: 'total',
      items: [
        {
          productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          quantity: 2,
        },
        {
          productId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          quantity: 3,
        },
      ],
    });
  });

  it('should perform partial refund when items provided', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, status: OrderStatus.PAID });
    const items = [
      createTestItem(
        'item-1',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        5,
        'Product A',
      ),
    ];
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue(items);

    await useCase.execute(createTestStaff(), orderId, {
      reason: 'partial broken',
      items: [{ orderItemId: 'item-1', quantity: 2 }],
    });

    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      2,
    );
    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.status).toBe(OrderStatus.PAID);
    expect(eventArg.metadata).toEqual({
      refundType: 'partial',
      items: [
        {
          productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          quantity: 2,
        },
      ],
    });
  });

  it('should throw POS_REFUND_QUANTITY_EXCEEDED when partial refund quantity > order item quantity', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, status: OrderStatus.PAID });
    const items = [
      createTestItem('item-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
    ];
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue(items);

    await expect(
      useCase.execute(createTestStaff(), orderId, {
        reason: 'too many',
        items: [{ orderItemId: 'item-1', quantity: 5 }],
      }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), orderId, {
        reason: 'too many',
        items: [{ orderItemId: 'item-1', quantity: 5 }],
      }),
    ).rejects.toThrow(ErrorMessages.POS_REFUND_QUANTITY_EXCEEDED);
  });

  it('should throw ORDER_NOT_FOUND when partial refund references non-existent orderItemId', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, status: OrderStatus.PAID });
    const items = [
      createTestItem('item-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
    ];
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue(items);

    await expect(
      useCase.execute(createTestStaff(), orderId, {
        reason: 'wrong id',
        items: [{ orderItemId: 'non-existent', quantity: 1 }],
      }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute(createTestStaff(), orderId, {
        reason: 'wrong id',
        items: [{ orderItemId: 'non-existent', quantity: 1 }],
      }),
    ).rejects.toThrow(ErrorMessages.ORDER_NOT_FOUND);
  });

  it('should sort stock restore calls by productId for deadlock prevention', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId, status: OrderStatus.PAID });
    const items = [
      createTestItem(
        'item-1',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        1,
        'C',
      ),
      createTestItem(
        'item-2',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        1,
        'A',
      ),
      createTestItem(
        'item-3',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        1,
        'B',
      ),
    ];
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.findItemsByOrderId.mockResolvedValue(items);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);

    await useCase.execute(createTestStaff(), orderId, { reason: 'all' });

    expect(mockOrderRepo.atomicStockRestore).toHaveBeenCalledTimes(3);
    expect(mockOrderRepo.atomicStockRestore.mock.calls[0][0]).toBe(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    expect(mockOrderRepo.atomicStockRestore.mock.calls[1][0]).toBe(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    );
    expect(mockOrderRepo.atomicStockRestore.mock.calls[2][0]).toBe(
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
    );
  });
});
