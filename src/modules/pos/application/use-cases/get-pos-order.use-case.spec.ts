import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderItem } from '@modules/orders/domain/entities/order-item.entity';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

import { GetPosOrderUseCase } from './get-pos-order.use-case';

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

function createTestOrder(
  overrides: Partial<{
    id: string;
    orderNumber: string;
    userId: string;
    channel: OrderChannel;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
  }> = {},
): Order {
  return Order.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    orderNumber: overrides.orderNumber ?? 'POS-0001',
    userId: overrides.userId ?? 'staff-id',
    channel: overrides.channel ?? OrderChannel.POS,
    status: overrides.status ?? OrderStatus.PAID,
    paymentMethod: overrides.paymentMethod ?? PaymentMethod.CASH,
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

function createTestOrderItem(orderId: string, productId: string): OrderItem {
  return OrderItem.reconstitute({
    id: '22222222-2222-2222-2222-222222222222',
    orderId,
    productId,
    productName: 'Test Product',
    productSlug: 'test-product',
    productImage: null,
    unitPrice: 5000,
    quantity: 2,
    subtotal: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createTestOrderEvent(orderId: string): OrderEvent {
  return OrderEvent.reconstitute({
    id: '33333333-3333-3333-3333-333333333333',
    orderId,
    status: OrderStatus.PAID,
    description: 'Venta POS registrada por Test Staff',
    performedBy: 'staff-id',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetPosOrderUseCase', () => {
  let useCase: GetPosOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPosOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetPosOrderUseCase>(GetPosOrderUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return OrderResponseDto with items and events when found', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({ id: orderId });
    const items = [
      createTestOrderItem(orderId, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ];
    const events = [createTestOrderEvent(orderId)];

    mockOrderRepo.findByIdWithDetails.mockResolvedValue({
      order,
      items,
      events,
    });

    const result = await useCase.execute(orderId);

    expect(mockOrderRepo.findByIdWithDetails).toHaveBeenCalledWith(orderId);
    expect(result).toBeInstanceOf(OrderResponseDto);
    expect(result.id).toBe(orderId);
    expect(result.channel).toBe(OrderChannel.POS);
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0].productName).toBe('Test Product');
    expect(result.events).toHaveLength(1);
    expect(result.events?.[0].description).toBe(
      'Venta POS registrada por Test Staff',
    );
    expect(result.paymentUrl).toBeNull();
  });

  it('should throw DomainNotFoundException with ORDER_NOT_FOUND when not found', async () => {
    const orderId = '99999999-9999-9999-9999-999999999999';
    mockOrderRepo.findByIdWithDetails.mockResolvedValue(null);

    await expect(useCase.execute(orderId)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(orderId)).rejects.toThrow(
      ErrorMessages.ORDER_NOT_FOUND,
    );
    expect(mockOrderRepo.findByIdWithDetails).toHaveBeenCalledWith(orderId);
  });

  it('should throw DomainException with POS_ORDER_NOT_POS when channel is online', async () => {
    const orderId = '11111111-1111-1111-1111-111111111111';
    const order = createTestOrder({
      id: orderId,
      channel: OrderChannel.ONLINE,
    });

    mockOrderRepo.findByIdWithDetails.mockResolvedValue({
      order,
      items: [],
      events: [],
    });

    await expect(useCase.execute(orderId)).rejects.toThrow(DomainException);
    await expect(useCase.execute(orderId)).rejects.toThrow(
      ErrorMessages.POS_ORDER_NOT_POS,
    );
  });
});
