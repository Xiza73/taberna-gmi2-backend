import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';

import { AdminPosOrdersController } from '@modules/pos/presentation/admin-pos-orders.controller';
import { CreatePosOrderUseCase } from '@modules/pos/application/use-cases/create-pos-order.use-case';
import { ListPosOrdersUseCase } from '@modules/pos/application/use-cases/list-pos-orders.use-case';
import { GetPosOrderUseCase } from '@modules/pos/application/use-cases/get-pos-order.use-case';
import { CancelPosOrderUseCase } from '@modules/pos/application/use-cases/cancel-pos-order.use-case';
import { RefundPosOrderUseCase } from '@modules/pos/application/use-cases/refund-pos-order.use-case';

const SUPER_ADMIN = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'super@test.com',
  name: 'Super Admin',
  role: StaffRole.SUPER_ADMIN,
  subjectType: 'staff' as const,
};

const ADMIN = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  email: 'admin@test.com',
  name: 'Admin',
  role: StaffRole.ADMIN,
  subjectType: 'staff' as const,
};

let currentUser: typeof SUPER_ADMIN | typeof ADMIN = SUPER_ADMIN;

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    req['user'] = { ...currentUser };
    return true;
  }
}

const mockCreatePosOrder = { execute: jest.fn() };
const mockListPosOrders = { execute: jest.fn() };
const mockGetPosOrder = { execute: jest.fn() };
const mockCancelPosOrder = { execute: jest.fn() };
const mockRefundPosOrder = { execute: jest.fn() };

interface FakeOrderResponseOverrides {
  id?: string;
  orderNumber?: string;
  total?: number;
  status?: string;
  channel?: string;
}

function createFakeOrderResponse(overrides: FakeOrderResponseOverrides = {}) {
  return {
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    orderNumber: overrides.orderNumber ?? 'ORD-20260101-001',
    userId: null,
    staffId: SUPER_ADMIN.id,
    channel: overrides.channel ?? 'pos',
    status: overrides.status ?? 'paid',
    paymentMethod: 'cash',
    shippingMethod: 'pickup',
    subtotal: 1000,
    discount: 0,
    shippingCost: 0,
    total: overrides.total ?? 1000,
    couponId: null,
    couponCode: null,
    couponDiscount: null,
    shippingAddressSnapshot: null,
    customerName: 'Cliente Test',
    customerEmail: '',
    customerPhone: null,
    customerDocType: null,
    customerDocNumber: null,
    notes: null,
    adminNotes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  };
}

// Valid UUID v4 strings (3rd group starts with 4, 4th group starts with 8/9/a/b)
const ORDER_ID = '22222222-2222-4222-8222-222222222222';
const PRODUCT_ID = '33333333-3333-4333-8333-333333333333';
const ORDER_ITEM_ID = '44444444-4444-4444-8444-444444444444';

describe('AdminPosOrdersController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPosOrdersController],
      providers: [
        {
          provide: CreatePosOrderUseCase,
          useValue: mockCreatePosOrder as unknown as CreatePosOrderUseCase,
        },
        {
          provide: ListPosOrdersUseCase,
          useValue: mockListPosOrders as unknown as ListPosOrdersUseCase,
        },
        {
          provide: GetPosOrderUseCase,
          useValue: mockGetPosOrder as unknown as GetPosOrderUseCase,
        },
        {
          provide: CancelPosOrderUseCase,
          useValue: mockCancelPosOrder as unknown as CancelPosOrderUseCase,
        },
        {
          provide: RefundPosOrderUseCase,
          useValue: mockRefundPosOrder as unknown as RefundPosOrderUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards(new MockJwtAuthGuard());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          const flatten = (
            errs: { constraints?: Record<string, string>; children?: unknown[] }[],
          ): string[] =>
            errs.flatMap((e) => [
              ...Object.values(e.constraints ?? {}),
              ...flatten(
                (e.children ?? []) as {
                  constraints?: Record<string, string>;
                  children?: unknown[];
                }[],
              ),
            ]);
          throw new BadRequestException(flatten(errors));
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = SUPER_ADMIN;
  });

  // ── POST /api/v1/admin/pos/orders ──────────────────────────────────────

  describe('POST /api/v1/admin/pos/orders', () => {
    const validBody = {
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
      paymentMethod: 'cash',
      customerName: 'Juan Perez',
    };

    it('should create POS order successfully', async () => {
      const fake = createFakeOrderResponse({
        orderNumber: 'ORD-20260101-001',
      });
      mockCreatePosOrder.execute.mockResolvedValue(fake);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send(validBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: fake.id,
        orderNumber: 'ORD-20260101-001',
      });
      expect(res.body.message).toBe('Venta POS registrada');
      expect(mockCreatePosOrder.execute).toHaveBeenCalledWith(
        { id: SUPER_ADMIN.id, name: SUPER_ADMIN.name },
        expect.objectContaining({
          paymentMethod: 'cash',
          customerName: 'Juan Perez',
        }),
      );
    });

    it('should reject when items array is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send({ ...validBody, items: [] })
        .expect(400);

      expect(mockCreatePosOrder.execute).not.toHaveBeenCalled();
    });

    it('should reject when paymentMethod is missing', async () => {
      const { paymentMethod: _omit, ...body } = validBody;

      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send(body)
        .expect(400);

      expect(mockCreatePosOrder.execute).not.toHaveBeenCalled();
    });

    it('should reject when customerName is missing', async () => {
      const { customerName: _omit, ...body } = validBody;

      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send(body)
        .expect(400);

      expect(mockCreatePosOrder.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid customerDocNumber format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send({
          ...validBody,
          customerDocType: 'dni',
          customerDocNumber: '123', // too short for both DNI (8) and RUC (11)
        })
        .expect(400);

      expect(mockCreatePosOrder.execute).not.toHaveBeenCalled();
    });

    it('should accept valid DNI customerDocNumber (8 digits)', async () => {
      mockCreatePosOrder.execute.mockResolvedValue(createFakeOrderResponse());

      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send({
          ...validBody,
          customerDocType: 'dni',
          customerDocNumber: '12345678',
        })
        .expect(201);

      expect(mockCreatePosOrder.execute).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid paymentMethod enum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders')
        .send({ ...validBody, paymentMethod: 'bitcoin' })
        .expect(400);

      expect(mockCreatePosOrder.execute).not.toHaveBeenCalled();
    });
  });

  // ── GET /api/v1/admin/pos/orders ───────────────────────────────────────

  describe('GET /api/v1/admin/pos/orders', () => {
    it('should list POS orders with default pagination', async () => {
      const fake = createFakeOrderResponse();
      mockListPosOrders.execute.mockResolvedValue({
        items: [fake],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/orders')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        items: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(res.body.data.items).toHaveLength(1);
    });

    it('should pass query filters to use case', async () => {
      mockListPosOrders.execute.mockResolvedValue({
        items: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/orders')
        .query({
          page: '2',
          limit: '10',
          channel: 'pos',
          paymentMethod: 'cash',
          search: 'juan',
          sortBy: 'total',
        })
        .expect(200);

      expect(mockListPosOrders.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          channel: 'pos',
          paymentMethod: 'cash',
          search: 'juan',
          sortBy: 'total',
        }),
      );
    });
  });

  // ── GET /api/v1/admin/pos/orders/:id ───────────────────────────────────

  describe('GET /api/v1/admin/pos/orders/:id', () => {
    it('should return order detail', async () => {
      const fake = createFakeOrderResponse({ id: ORDER_ID });
      mockGetPosOrder.execute.mockResolvedValue(fake);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/pos/orders/${ORDER_ID}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(ORDER_ID);
      expect(mockGetPosOrder.execute).toHaveBeenCalledWith(ORDER_ID);
    });

    it('should reject invalid uuid format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/orders/not-a-uuid')
        .expect(400);

      expect(mockGetPosOrder.execute).not.toHaveBeenCalled();
    });
  });

  // ── POST /api/v1/admin/pos/orders/:id/cancel ───────────────────────────

  describe('POST /api/v1/admin/pos/orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      mockCancelPosOrder.execute.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/cancel`)
        .send({ reason: 'Cliente arrepentido' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Venta anulada');
      expect(mockCancelPosOrder.execute).toHaveBeenCalledWith(
        { id: SUPER_ADMIN.id, name: SUPER_ADMIN.name },
        ORDER_ID,
        expect.objectContaining({ reason: 'Cliente arrepentido' }),
      );
    });

    it('should reject when reason is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/cancel`)
        .send({})
        .expect(400);

      expect(mockCancelPosOrder.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid uuid in cancel path', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/orders/not-a-uuid/cancel')
        .send({ reason: 'foo' })
        .expect(400);

      expect(mockCancelPosOrder.execute).not.toHaveBeenCalled();
    });
  });

  // ── POST /api/v1/admin/pos/orders/:id/refund ───────────────────────────

  describe('POST /api/v1/admin/pos/orders/:id/refund', () => {
    it('should refund (full) successfully', async () => {
      mockRefundPosOrder.execute.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/refund`)
        .send({ reason: 'Producto fallado' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Devolución registrada');
      expect(mockRefundPosOrder.execute).toHaveBeenCalledWith(
        { id: SUPER_ADMIN.id, name: SUPER_ADMIN.name },
        ORDER_ID,
        expect.objectContaining({ reason: 'Producto fallado' }),
      );
    });

    it('should refund (partial) with items array', async () => {
      mockRefundPosOrder.execute.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/refund`)
        .send({
          reason: 'Devuelve uno',
          items: [{ orderItemId: ORDER_ITEM_ID, quantity: 1 }],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(mockRefundPosOrder.execute).toHaveBeenCalledWith(
        { id: SUPER_ADMIN.id, name: SUPER_ADMIN.name },
        ORDER_ID,
        expect.objectContaining({
          reason: 'Devuelve uno',
          items: [
            expect.objectContaining({
              orderItemId: ORDER_ITEM_ID,
              quantity: 1,
            }),
          ],
        }),
      );
    });

    it('should reject when reason is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/refund`)
        .send({})
        .expect(400);

      expect(mockRefundPosOrder.execute).not.toHaveBeenCalled();
    });

    it('should reject empty items array on partial refund', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/pos/orders/${ORDER_ID}/refund`)
        .send({ reason: 'foo', items: [] })
        .expect(400);

      expect(mockRefundPosOrder.execute).not.toHaveBeenCalled();
    });
  });
});
