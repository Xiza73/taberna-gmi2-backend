import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

import { ListPosOrdersUseCase } from './list-pos-orders.use-case';

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
    channel: OrderChannel;
    paymentMethod: PaymentMethod;
    total: number;
  }> = {},
): Order {
  return Order.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    orderNumber: overrides.orderNumber ?? 'POS-0001',
    userId: null,
    staffId: 'staff-id',
    channel: overrides.channel ?? OrderChannel.POS,
    status: OrderStatus.PAID,
    paymentMethod: overrides.paymentMethod ?? PaymentMethod.CASH,
    shippingMethod: ShippingMethod.PICKUP,
    subtotal: overrides.total ?? 10000,
    discount: 0,
    shippingCost: 0,
    total: overrides.total ?? 10000,
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

describe('ListPosOrdersUseCase', () => {
  let useCase: ListPosOrdersUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPosOrdersUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<ListPosOrdersUseCase>(ListPosOrdersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should default to filtering by channelIn=[pos, whatsapp] when channel not specified', async () => {
    mockOrderRepo.findAll.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ page: 1, limit: 20 });

    const callArg = mockOrderRepo.findAll.mock.calls[0][0] as {
      channel?: string;
      channelIn?: string[];
    };
    expect(callArg.channel).toBeUndefined();
    expect(callArg.channelIn).toEqual([OrderChannel.POS, OrderChannel.WHATSAPP]);
  });

  it('should pass channel filter when specified', async () => {
    mockOrderRepo.findAll.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ page: 1, limit: 20, channel: OrderChannel.POS });

    const callArg = mockOrderRepo.findAll.mock.calls[0][0] as {
      channel?: string;
      channelIn?: string[];
    };
    expect(callArg.channel).toBe(OrderChannel.POS);
    expect(callArg.channelIn).toBeUndefined();
  });

  it('should map sortBy=createdAt to undefined', async () => {
    mockOrderRepo.findAll.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ page: 1, limit: 20, sortBy: 'createdAt' });

    const callArg = mockOrderRepo.findAll.mock.calls[0][0] as {
      sortBy?: string;
    };
    expect(callArg.sortBy).toBeUndefined();
  });

  it('should pass sortBy=total through', async () => {
    mockOrderRepo.findAll.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ page: 1, limit: 20, sortBy: 'total' });

    const callArg = mockOrderRepo.findAll.mock.calls[0][0] as {
      sortBy?: string;
    };
    expect(callArg.sortBy).toBe('total');
  });

  it('should return PaginatedResponseDto with totalPages calculated', async () => {
    const order1 = createTestOrder({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      orderNumber: 'POS-0001',
    });
    const order2 = createTestOrder({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      orderNumber: 'POS-0002',
    });

    mockOrderRepo.findAll.mockResolvedValue({
      items: [order1, order2],
      total: 25,
    });

    const result = await useCase.execute({ page: 2, limit: 10 });

    expect(result).toBeInstanceOf(PaginatedResponseDto);
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('should default page=1 limit=20 when not provided', async () => {
    mockOrderRepo.findAll.mockResolvedValue({ items: [], total: 0 });

    const result = await useCase.execute({});

    const callArg = mockOrderRepo.findAll.mock.calls[0][0] as {
      page: number;
      limit: number;
    };
    expect(callArg.page).toBe(1);
    expect(callArg.limit).toBe(20);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should map each Order to OrderResponseDto', async () => {
    const order1 = createTestOrder({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      orderNumber: 'POS-0001',
      total: 5000,
    });
    const order2 = createTestOrder({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      orderNumber: 'POS-0002',
      total: 7500,
    });

    mockOrderRepo.findAll.mockResolvedValue({
      items: [order1, order2],
      total: 2,
    });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toBeInstanceOf(OrderResponseDto);
    expect(result.items[1]).toBeInstanceOf(OrderResponseDto);
    expect(result.items[0].orderNumber).toBe('POS-0001');
    expect(result.items[0].total).toBe(5000);
    expect(result.items[1].orderNumber).toBe('POS-0002');
    expect(result.items[1].total).toBe(7500);
  });
});
