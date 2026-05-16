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

import { AdminCashRegisterController } from '@modules/cash-register/presentation/admin-cash-register.controller';
import { CloseCashRegisterUseCase } from '@modules/cash-register/application/use-cases/close-cash-register.use-case';
import { CreateCashMovementUseCase } from '@modules/cash-register/application/use-cases/create-cash-movement.use-case';
import { GetCashRegisterUseCase } from '@modules/cash-register/application/use-cases/get-cash-register.use-case';
import { GetCurrentCashRegisterUseCase } from '@modules/cash-register/application/use-cases/get-current-cash-register.use-case';
import { ListCashMovementsUseCase } from '@modules/cash-register/application/use-cases/list-cash-movements.use-case';
import { ListCashRegistersUseCase } from '@modules/cash-register/application/use-cases/list-cash-registers.use-case';
import { OpenCashRegisterUseCase } from '@modules/cash-register/application/use-cases/open-cash-register.use-case';

const SUPER_ADMIN = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'super@test.com',
  name: 'Super Admin',
  role: StaffRole.SUPER_ADMIN,
  subjectType: 'staff' as const,
};

let currentUser: typeof SUPER_ADMIN = SUPER_ADMIN;

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    req['user'] = { ...currentUser };
    return true;
  }
}

const mockOpen = { execute: jest.fn() };
const mockClose = { execute: jest.fn() };
const mockCurrent = { execute: jest.fn() };
const mockGet = { execute: jest.fn() };
const mockList = { execute: jest.fn() };
const mockCreateMovement = { execute: jest.fn() };
const mockListMovements = { execute: jest.fn() };

const REGISTER_ID = '22222222-2222-4222-8222-222222222222';

function fakeRegister(overrides: { closed?: boolean; id?: string } = {}) {
  return {
    id: overrides.id ?? REGISTER_ID,
    staffId: SUPER_ADMIN.id,
    openedAt: new Date('2026-01-01T10:00:00Z').toISOString(),
    closedAt: overrides.closed
      ? new Date('2026-01-01T20:00:00Z').toISOString()
      : null,
    initialAmount: 10000,
    closingAmount: overrides.closed ? 70000 : null,
    expectedAmount: overrides.closed ? 70000 : null,
    difference: overrides.closed ? 0 : null,
    cashSalesAmount: overrides.closed ? 50000 : 0,
    cashInAmount: overrides.closed ? 7500 : 0,
    cashOutAmount: overrides.closed ? 1500 : 0,
    status: overrides.closed ? 'closed' : 'open',
    notes: null,
    createdAt: new Date('2026-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-01T10:00:00Z').toISOString(),
  };
}

function fakeMovement(overrides: { id?: string; type?: 'cash_in' | 'cash_out' } = {}) {
  return {
    id: overrides.id ?? 'mv-1',
    cashRegisterId: REGISTER_ID,
    staffId: SUPER_ADMIN.id,
    type: overrides.type ?? 'cash_in',
    amount: 1500,
    reason: 'aporte',
    createdAt: new Date('2026-01-01T11:00:00Z').toISOString(),
  };
}

describe('AdminCashRegisterController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminCashRegisterController],
      providers: [
        {
          provide: OpenCashRegisterUseCase,
          useValue: mockOpen as unknown as OpenCashRegisterUseCase,
        },
        {
          provide: CloseCashRegisterUseCase,
          useValue: mockClose as unknown as CloseCashRegisterUseCase,
        },
        {
          provide: GetCurrentCashRegisterUseCase,
          useValue: mockCurrent as unknown as GetCurrentCashRegisterUseCase,
        },
        {
          provide: GetCashRegisterUseCase,
          useValue: mockGet as unknown as GetCashRegisterUseCase,
        },
        {
          provide: ListCashRegistersUseCase,
          useValue: mockList as unknown as ListCashRegistersUseCase,
        },
        {
          provide: CreateCashMovementUseCase,
          useValue: mockCreateMovement as unknown as CreateCashMovementUseCase,
        },
        {
          provide: ListCashMovementsUseCase,
          useValue: mockListMovements as unknown as ListCashMovementsUseCase,
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

  // ── POST /api/v1/admin/pos/cash-register/open ────────────────────────

  describe('POST /api/v1/admin/pos/cash-register/open', () => {
    it('should open a cash register successfully', async () => {
      mockOpen.execute.mockResolvedValue(fakeRegister());

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/open')
        .send({ initialAmount: 10000 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(REGISTER_ID);
      expect(res.body.data.status).toBe('open');
      expect(res.body.message).toBe('Caja abierta');
      expect(mockOpen.execute).toHaveBeenCalledWith(
        SUPER_ADMIN.id,
        expect.objectContaining({ initialAmount: 10000 }),
      );
    });

    it('should reject when initialAmount is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/open')
        .send({})
        .expect(400);
      expect(mockOpen.execute).not.toHaveBeenCalled();
    });

    it('should reject when initialAmount is negative', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/open')
        .send({ initialAmount: -1 })
        .expect(400);
      expect(mockOpen.execute).not.toHaveBeenCalled();
    });

    it('should reject when initialAmount is not an integer', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/open')
        .send({ initialAmount: 10.5 })
        .expect(400);
      expect(mockOpen.execute).not.toHaveBeenCalled();
    });
  });

  // ── POST /api/v1/admin/pos/cash-register/close ───────────────────────

  describe('POST /api/v1/admin/pos/cash-register/close', () => {
    it('should close a cash register successfully', async () => {
      mockClose.execute.mockResolvedValue(fakeRegister({ closed: true }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/close')
        .send({ closingAmount: 70000, notes: 'cierre limpio' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('closed');
      expect(res.body.message).toBe('Caja cerrada');
      expect(mockClose.execute).toHaveBeenCalledWith(
        SUPER_ADMIN.id,
        expect.objectContaining({
          closingAmount: 70000,
          notes: 'cierre limpio',
        }),
      );
    });

    it('should accept close without notes', async () => {
      mockClose.execute.mockResolvedValue(fakeRegister({ closed: true }));

      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/close')
        .send({ closingAmount: 70000 })
        .expect(201);

      expect(mockClose.execute).toHaveBeenCalledTimes(1);
    });

    it('should reject when closingAmount is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/close')
        .send({})
        .expect(400);
      expect(mockClose.execute).not.toHaveBeenCalled();
    });

    it('should reject when closingAmount is negative', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/close')
        .send({ closingAmount: -50 })
        .expect(400);
      expect(mockClose.execute).not.toHaveBeenCalled();
    });
  });

  // ── GET /api/v1/admin/pos/cash-register/current ──────────────────────

  describe('GET /api/v1/admin/pos/cash-register/current', () => {
    it('should return the current open register', async () => {
      mockCurrent.execute.mockResolvedValue(fakeRegister());

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register/current')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('open');
      expect(mockCurrent.execute).toHaveBeenCalledWith(SUPER_ADMIN.id);
    });
  });

  // ── POST /api/v1/admin/pos/cash-register/movements ───────────────────

  describe('POST /api/v1/admin/pos/cash-register/movements', () => {
    it('should create a cash_in movement', async () => {
      mockCreateMovement.execute.mockResolvedValue(fakeMovement());

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'cash_in', amount: 1500, reason: 'aporte' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('cash_in');
      expect(res.body.message).toBe('Movimiento registrado');
      expect(mockCreateMovement.execute).toHaveBeenCalledWith(
        SUPER_ADMIN.id,
        expect.objectContaining({
          type: 'cash_in',
          amount: 1500,
          reason: 'aporte',
        }),
      );
    });

    it('should create a cash_out movement', async () => {
      mockCreateMovement.execute.mockResolvedValue(
        fakeMovement({ type: 'cash_out' }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'cash_out', amount: 800, reason: 'pago proveedor' })
        .expect(201);

      expect(res.body.data.type).toBe('cash_out');
    });

    it('should reject invalid type enum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'invalid', amount: 100, reason: 'x' })
        .expect(400);
      expect(mockCreateMovement.execute).not.toHaveBeenCalled();
    });

    it('should reject zero amount', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'cash_in', amount: 0, reason: 'x' })
        .expect(400);
      expect(mockCreateMovement.execute).not.toHaveBeenCalled();
    });

    it('should reject empty reason', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'cash_in', amount: 100, reason: '' })
        .expect(400);
      expect(mockCreateMovement.execute).not.toHaveBeenCalled();
    });

    it('should reject when reason exceeds max length', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/pos/cash-register/movements')
        .send({ type: 'cash_in', amount: 100, reason: 'a'.repeat(501) })
        .expect(400);
      expect(mockCreateMovement.execute).not.toHaveBeenCalled();
    });
  });

  // ── GET /api/v1/admin/pos/cash-register/movements ────────────────────

  describe('GET /api/v1/admin/pos/cash-register/movements', () => {
    it('should list movements (route order: movements before :id)', async () => {
      mockListMovements.execute.mockResolvedValue([
        fakeMovement({ id: 'mv-a' }),
        fakeMovement({ id: 'mv-b', type: 'cash_out' }),
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register/movements')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(mockListMovements.execute).toHaveBeenCalledWith(SUPER_ADMIN.id);
      // Confirm /:id was NOT used (no UUID param resolved)
      expect(mockGet.execute).not.toHaveBeenCalled();
    });

    it('should return empty array when there are no movements', async () => {
      mockListMovements.execute.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register/movements')
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  // ── GET /api/v1/admin/pos/cash-register ──────────────────────────────

  describe('GET /api/v1/admin/pos/cash-register', () => {
    function fakePaginated(items: ReturnType<typeof fakeRegister>[]) {
      return {
        items: items.map((it) => ({ ...it, staffName: 'Super Admin' })),
        total: items.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }

    it('should return paginated list with staffName-enriched items', async () => {
      mockList.execute.mockResolvedValue(
        fakePaginated([
          fakeRegister({ closed: true, id: REGISTER_ID }),
          fakeRegister({ id: '33333333-3333-4333-8333-333333333333' }),
        ]),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].staffName).toBe('Super Admin');
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(20);
      expect(mockList.execute).toHaveBeenCalledTimes(1);
    });

    it('should parse filters and forward them to the use case', async () => {
      mockList.execute.mockResolvedValue(fakePaginated([]));
      const validStaffId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .query({
          page: '2',
          limit: '10',
          staffId: validStaffId,
          status: 'closed',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        })
        .expect(200);

      expect(mockList.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          staffId: validStaffId,
          status: 'closed',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        }),
      );
    });

    it('should reject invalid staffId (not a uuid)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .query({ staffId: 'not-a-uuid' })
        .expect(400);
      expect(mockList.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid status enum', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .query({ status: 'invalid' })
        .expect(400);
      expect(mockList.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .query({ dateFrom: 'not-a-date' })
        .expect(400);
      expect(mockList.execute).not.toHaveBeenCalled();
    });

    it('should reject limit greater than max (50)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register')
        .query({ limit: '999' })
        .expect(400);
      expect(mockList.execute).not.toHaveBeenCalled();
    });
  });

  // ── GET /api/v1/admin/pos/cash-register/:id ──────────────────────────

  describe('GET /api/v1/admin/pos/cash-register/:id', () => {
    it('should return register detail with movements', async () => {
      const closed = fakeRegister({ closed: true });
      mockGet.execute.mockResolvedValue({
        ...closed,
        movements: [fakeMovement()],
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/pos/cash-register/${REGISTER_ID}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(REGISTER_ID);
      expect(res.body.data.movements).toHaveLength(1);
      expect(mockGet.execute).toHaveBeenCalledWith(REGISTER_ID);
    });

    it('should reject invalid uuid format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/cash-register/not-a-uuid')
        .expect(400);
      expect(mockGet.execute).not.toHaveBeenCalled();
    });
  });
});
