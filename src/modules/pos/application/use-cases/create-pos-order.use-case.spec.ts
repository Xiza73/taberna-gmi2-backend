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

import { ADDRESS_REPOSITORY } from '@modules/addresses/domain/interfaces/address-repository.interface';
import { Address } from '@modules/addresses/domain/entities/address.entity';
import { PRODUCT_REPOSITORY } from '@modules/products/domain/interfaces/product-repository.interface';
import { Product } from '@modules/products/domain/entities/product.entity';
import { COUPON_REPOSITORY } from '@modules/coupons/domain/interfaces/coupon-repository.interface';
import { Coupon } from '@modules/coupons/domain/entities/coupon.entity';
import { CouponType } from '@modules/coupons/domain/enums/coupon-type.enum';
import {
  COUPON_CALCULATOR,
  CouponCalculator,
} from '@modules/coupons/domain/services/coupon-calculator';
import { EMAIL_SENDER } from '@modules/notifications/domain/interfaces/email-sender.interface';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderItem } from '@modules/orders/domain/entities/order-item.entity';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';
import { ORDER_NUMBER_GENERATOR } from '@modules/orders/domain/interfaces/order-number-generator.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

import { CreatePosOrderUseCase } from './create-pos-order.use-case';

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

const mockOrderNumberGenerator = {
  generate: jest.fn(),
};

const mockAddressRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findAllByUserId: jest.fn(),
  countByUserId: jest.fn(),
  setDefault: jest.fn(),
  delete: jest.fn(),
  withTransaction: jest.fn().mockReturnThis(),
};

const mockProductRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  slugExists: jest.fn(),
  skuExists: jest.fn(),
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

const mockCouponCalculator = {
  validate: jest.fn(),
  calculateDiscount: jest.fn(),
};

const mockEmailSender = {
  sendWelcome: jest.fn(),
  sendOrderConfirmation: jest.fn(),
  sendPaymentConfirmed: jest.fn(),
  sendOrderShipped: jest.fn(),
  sendOrderDelivered: jest.fn(),
  sendPasswordReset: jest.fn(),
  sendStaffInvitation: jest.fn(),
};

function createTestStaff(): { id: string; name: string } {
  return { id: 'staff-id-1', name: 'Test Staff' };
}

function createTestProduct(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: string[];
    isActive: boolean;
  }> = {},
): Product {
  return Product.reconstitute({
    id: overrides.id ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: overrides.name ?? 'Test Product',
    slug: overrides.slug ?? 'test-product',
    description: 'desc',
    price: overrides.price ?? 1000,
    compareAtPrice: null,
    sku: null,
    stock: overrides.stock ?? 100,
    images: overrides.images ?? ['image1.jpg'],
    categoryId: 'cat-1',
    isActive: overrides.isActive ?? true,
    averageRating: null,
    totalReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createTestAddress(): Address {
  return Address.reconstitute({
    id: 'addr-1',
    userId: 'staff-id-1',
    label: 'Casa',
    recipientName: 'Juan Perez',
    phone: '+51999999999',
    street: 'Av. Siempre Viva 123',
    district: 'Miraflores',
    city: 'Lima',
    department: 'Lima',
    zipCode: '15074',
    reference: 'casa azul',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createTestCoupon(
  overrides: Partial<{
    id: string;
    code: string;
    maxUsesPerUser: number | null;
  }> = {},
): Coupon {
  const now = new Date();
  const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const past = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  return Coupon.reconstitute({
    id: overrides.id ?? 'coupon-1',
    code: overrides.code ?? 'TEST10',
    type: CouponType.FIXED_AMOUNT,
    value: 1000,
    minPurchase: null,
    maxDiscount: null,
    maxUses: null,
    maxUsesPerUser: overrides.maxUsesPerUser ?? null,
    currentUses: 0,
    isActive: true,
    startDate: past,
    endDate: future,
    createdAt: now,
    updatedAt: now,
  });
}

describe('CreatePosOrderUseCase', () => {
  let useCase: CreatePosOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePosOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
        {
          provide: ORDER_NUMBER_GENERATOR,
          useValue: mockOrderNumberGenerator,
        },
        { provide: ADDRESS_REPOSITORY, useValue: mockAddressRepo },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo },
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepo },
        {
          provide: COUPON_CALCULATOR,
          useValue: mockCouponCalculator as unknown as CouponCalculator,
        },
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork as IUnitOfWork },
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
      ],
    }).compile();

    useCase = module.get<CreatePosOrderUseCase>(CreatePosOrderUseCase);

    // Default behaviors used by most happy-path tests.
    mockOrderNumberGenerator.generate.mockResolvedValue('POS-0001');
    mockOrderRepo.save.mockImplementation(async (order: Order) => order);
    mockOrderRepo.saveItem.mockImplementation(async (item: OrderItem) => item);
    mockOrderRepo.saveEvent.mockImplementation(
      async (event: OrderEvent) => event,
    );
    mockOrderRepo.atomicStockDecrement.mockResolvedValue(true);
    mockOrderRepo.atomicStatusTransition.mockResolvedValue(true);
    mockOrderRepo.findById.mockImplementation(async () => null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw POS_ITEMS_EMPTY when items array is empty', async () => {
    await expect(
      useCase.execute(createTestStaff(), {
        items: [],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'Test',
      }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), {
        items: [],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'Test',
      }),
    ).rejects.toThrow(ErrorMessages.POS_ITEMS_EMPTY);
    expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
  });

  it('should create POS order with cash payment method (status PAID directly)', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    mockProductRepo.findById.mockResolvedValue(product);

    const result = await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 2 },
      ],
      paymentMethod: PaymentMethod.CASH,
      channel: OrderChannel.POS,
      customerName: 'Walk-in Customer',
    });

    expect(mockProductRepo.findById).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    const savedOrder = mockOrderRepo.save.mock.calls[0][0] as Order;
    expect(savedOrder.paymentMethod).toBe(PaymentMethod.CASH);
    expect(savedOrder.channel).toBe(OrderChannel.POS);
    expect(savedOrder.shippingMethod).toBe(ShippingMethod.PICKUP);
    expect(savedOrder.subtotal).toBe(10000);
    expect(savedOrder.total).toBe(10000);
    expect(savedOrder.discount).toBe(0);
    expect(savedOrder.customerName).toBe('Walk-in Customer');
    expect(savedOrder.customerEmail).toBe('');

    expect(mockOrderRepo.saveItem).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.atomicStockDecrement).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      2,
    );
    expect(mockOrderRepo.atomicStatusTransition).toHaveBeenCalledWith(
      savedOrder.id,
      OrderStatus.PENDING,
      OrderStatus.PAID,
    );
    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.status).toBe(OrderStatus.PAID);
    expect(eventArg.description).toBe('Venta POS registrada por Test Staff');

    expect(mockCouponRepo.incrementUses).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(OrderResponseDto);
    expect(result.paymentUrl).toBeNull();
  });

  it('should keep status PENDING when paymentMethod is mercadopago', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    mockProductRepo.findById.mockResolvedValue(product);

    await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
      ],
      paymentMethod: PaymentMethod.MERCADOPAGO,
      channel: OrderChannel.POS,
      customerName: 'MP Customer',
    });

    expect(mockOrderRepo.atomicStatusTransition).not.toHaveBeenCalled();
    expect(mockOrderRepo.saveEvent).toHaveBeenCalledTimes(1);
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.status).toBe(OrderStatus.PENDING);
  });

  it('should throw PRODUCT_NOT_FOUND when a product is missing or inactive', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(createTestStaff(), {
        items: [
          { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
        ],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'X',
      }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute(createTestStaff(), {
        items: [
          { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
        ],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'X',
      }),
    ).rejects.toThrow(ErrorMessages.PRODUCT_NOT_FOUND);

    // Inactive product → same error.
    const inactiveProduct = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      isActive: false,
    });
    mockProductRepo.findById.mockResolvedValue(inactiveProduct);

    await expect(
      useCase.execute(createTestStaff(), {
        items: [
          { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
        ],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'X',
      }),
    ).rejects.toThrow(ErrorMessages.PRODUCT_NOT_FOUND);
  });

  it('should throw INSUFFICIENT_STOCK when atomicStockDecrement returns false', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    mockProductRepo.findById.mockResolvedValue(product);
    mockOrderRepo.atomicStockDecrement.mockResolvedValue(false);

    await expect(
      useCase.execute(createTestStaff(), {
        items: [
          { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 999 },
        ],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'X',
      }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(createTestStaff(), {
        items: [
          { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 999 },
        ],
        paymentMethod: PaymentMethod.CASH,
        channel: OrderChannel.POS,
        customerName: 'X',
      }),
    ).rejects.toThrow(ErrorMessages.INSUFFICIENT_STOCK);
  });

  it('should validate and apply coupon discount', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    const coupon = createTestCoupon({ code: 'TEST10' });
    mockProductRepo.findById.mockResolvedValue(product);
    mockCouponRepo.findByCode.mockResolvedValue(coupon);
    mockCouponCalculator.validate.mockReturnValue(undefined);
    mockCouponCalculator.calculateDiscount.mockReturnValue(1000);
    mockCouponRepo.incrementUses.mockResolvedValue(true);

    await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 2 },
      ],
      paymentMethod: PaymentMethod.CASH,
      channel: OrderChannel.POS,
      customerName: 'Cupón Customer',
      couponCode: 'TEST10',
    });

    expect(mockCouponRepo.findByCode).toHaveBeenCalledWith('TEST10');
    expect(mockCouponCalculator.validate).toHaveBeenCalledWith(coupon, 10000);
    expect(mockCouponCalculator.calculateDiscount).toHaveBeenCalledWith(
      coupon,
      10000,
    );
    expect(mockCouponRepo.incrementUses).toHaveBeenCalledWith(coupon.id);

    const savedOrder = mockOrderRepo.save.mock.calls[0][0] as Order;
    expect(savedOrder.discount).toBe(1000);
    expect(savedOrder.total).toBe(9000);
    expect(savedOrder.couponId).toBe(coupon.id);
    expect(savedOrder.couponCode).toBe(coupon.code);
    expect(savedOrder.couponDiscount).toBe(1000);
  });

  it('should send order confirmation email when customerEmail is provided', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    mockProductRepo.findById.mockResolvedValue(product);
    mockEmailSender.sendOrderConfirmation.mockResolvedValue(undefined);

    await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
      ],
      paymentMethod: PaymentMethod.CASH,
      channel: OrderChannel.POS,
      customerName: 'Has Email',
      customerEmail: 'has@example.com',
    });

    expect(mockEmailSender.sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.sendOrderConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'has@example.com',
        customerName: 'Has Email',
        orderNumber: 'POS-0001',
      }),
    );
  });

  it('should NOT send order confirmation email when customerEmail is empty', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    mockProductRepo.findById.mockResolvedValue(product);

    await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
      ],
      paymentMethod: PaymentMethod.CASH,
      channel: OrderChannel.POS,
      customerName: 'No Email',
    });

    expect(mockEmailSender.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it('should snapshot shipping address when addressId provided (whatsapp delivery)', async () => {
    const product = createTestProduct({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      price: 5000,
    });
    const address = createTestAddress();
    mockProductRepo.findById.mockResolvedValue(product);
    mockAddressRepo.findById.mockResolvedValue(address);

    await useCase.execute(createTestStaff(), {
      items: [
        { productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1 },
      ],
      paymentMethod: PaymentMethod.CASH,
      channel: OrderChannel.WHATSAPP,
      customerName: 'WA Customer',
      addressId: 'addr-1',
    });

    expect(mockAddressRepo.findById).toHaveBeenCalledWith('addr-1');
    const savedOrder = mockOrderRepo.save.mock.calls[0][0] as Order;
    expect(savedOrder.shippingAddressSnapshot).toEqual({
      label: 'Casa',
      recipientName: 'Juan Perez',
      phone: '+51999999999',
      street: 'Av. Siempre Viva 123',
      district: 'Miraflores',
      city: 'Lima',
      department: 'Lima',
      zipCode: '15074',
      reference: 'casa azul',
    });

    // El event description usa el formato whatsapp.
    const eventArg = mockOrderRepo.saveEvent.mock.calls[0][0] as OrderEvent;
    expect(eventArg.description).toBe(
      'Venta WhatsApp registrada por Test Staff',
    );
  });
});
