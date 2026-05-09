import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';
import { StaffRoleGuard } from '@shared/presentation/guards/staff-role.guard';

import { AdminPosReportsController } from '@modules/pos/presentation/admin-pos-reports.controller';
import { GetDailyPosReportUseCase } from '@modules/pos/application/use-cases/get-daily-pos-report.use-case';
import { GetPaymentMethodReportUseCase } from '@modules/pos/application/use-cases/get-payment-method-report.use-case';
import { GetStaffSalesReportUseCase } from '@modules/pos/application/use-cases/get-staff-sales-report.use-case';

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

const mockDaily = { execute: jest.fn() };
const mockByPaymentMethod = { execute: jest.fn() };
const mockByStaff = { execute: jest.fn() };

function fakeDailyReport(date: string) {
  return {
    date,
    totalOrders: 12,
    totalSales: 350000,
    byPaymentMethod: [
      { paymentMethod: 'cash', count: 8, total: 200000 },
      { paymentMethod: 'yape_plin', count: 4, total: 150000 },
    ],
    byStatus: [
      { status: 'paid', count: 10 },
      { status: 'cancelled', count: 1 },
      { status: 'refunded', count: 1 },
    ],
    topProducts: [
      {
        productId: 'p-1',
        productName: 'Cerveza Pilsen',
        quantity: 30,
        total: 90000,
      },
    ],
  };
}

function fakePaymentMethodReport(dateFrom: string, dateTo: string) {
  return {
    dateFrom,
    dateTo,
    items: [
      { paymentMethod: 'cash', count: 10, totalAmount: 200000 },
      { paymentMethod: 'yape_plin', count: 5, totalAmount: 150000 },
    ],
  };
}

function fakeStaffReport(dateFrom: string, dateTo: string) {
  return {
    dateFrom,
    dateTo,
    items: [
      { staffId: 'staff-1', staffName: 'Ana', count: 12, totalAmount: 240000 },
      { staffId: 'staff-2', staffName: 'Beto', count: 5, totalAmount: 100000 },
    ],
  };
}

describe('AdminPosReportsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPosReportsController],
      providers: [
        {
          provide: GetDailyPosReportUseCase,
          useValue: mockDaily as unknown as GetDailyPosReportUseCase,
        },
        {
          provide: GetPaymentMethodReportUseCase,
          useValue:
            mockByPaymentMethod as unknown as GetPaymentMethodReportUseCase,
        },
        {
          provide: GetStaffSalesReportUseCase,
          useValue: mockByStaff as unknown as GetStaffSalesReportUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new MockJwtAuthGuard(),
      new StaffRoleGuard(reflector),
    );
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

  // ── GET /api/v1/admin/pos/reports/daily ──────────────────────────────

  describe('GET /api/v1/admin/pos/reports/daily', () => {
    it('should return daily report for explicit date', async () => {
      mockDaily.execute.mockResolvedValue(fakeDailyReport('2026-05-08'));

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/daily')
        .query({ date: '2026-05-08' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe('2026-05-08');
      expect(res.body.data.totalOrders).toBe(12);
      expect(res.body.data.totalSales).toBe(350000);
      expect(res.body.data.byStatus).toEqual(
        expect.arrayContaining([
          { status: 'cancelled', count: 1 },
          { status: 'refunded', count: 1 },
        ]),
      );
      expect(mockDaily.execute).toHaveBeenCalledWith('2026-05-08');
    });

    it('should default date to undefined (use case picks today)', async () => {
      mockDaily.execute.mockResolvedValue(fakeDailyReport('2026-05-08'));

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/daily')
        .expect(200);

      expect(mockDaily.execute).toHaveBeenCalledWith(undefined);
    });

    it('should reject invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/daily')
        .query({ date: 'not-a-date' })
        .expect(400);
      expect(mockDaily.execute).not.toHaveBeenCalled();
    });

    it('should reject when extra params are sent (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/daily')
        .query({ date: '2026-05-08', evil: 'yes' })
        .expect(400);
      expect(mockDaily.execute).not.toHaveBeenCalled();
    });

    it('should be accessible to ADMIN role', async () => {
      currentUser = ADMIN;
      mockDaily.execute.mockResolvedValue(fakeDailyReport('2026-05-08'));

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/daily')
        .query({ date: '2026-05-08' })
        .expect(200);

      expect(mockDaily.execute).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /api/v1/admin/pos/reports/by-payment-method ──────────────────

  describe('GET /api/v1/admin/pos/reports/by-payment-method', () => {
    it('should return payment method report for a range', async () => {
      mockByPaymentMethod.execute.mockResolvedValue(
        fakePaymentMethodReport('2026-05-01', '2026-05-08'),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-payment-method')
        .query({ dateFrom: '2026-05-01', dateTo: '2026-05-08' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.dateFrom).toBe('2026-05-01');
      expect(res.body.data.dateTo).toBe('2026-05-08');
      expect(res.body.data.items).toHaveLength(2);
      expect(mockByPaymentMethod.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2026-05-01',
          dateTo: '2026-05-08',
        }),
      );
    });

    it('should reject when dateFrom is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-payment-method')
        .query({ dateTo: '2026-05-08' })
        .expect(400);
      expect(mockByPaymentMethod.execute).not.toHaveBeenCalled();
    });

    it('should reject when dateTo is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-payment-method')
        .query({ dateFrom: '2026-05-01' })
        .expect(400);
      expect(mockByPaymentMethod.execute).not.toHaveBeenCalled();
    });

    it('should reject when dates are invalid format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-payment-method')
        .query({ dateFrom: 'bad', dateTo: '2026-05-08' })
        .expect(400);
      expect(mockByPaymentMethod.execute).not.toHaveBeenCalled();
    });

    it('should be accessible to ADMIN role', async () => {
      currentUser = ADMIN;
      mockByPaymentMethod.execute.mockResolvedValue(
        fakePaymentMethodReport('2026-05-01', '2026-05-08'),
      );

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-payment-method')
        .query({ dateFrom: '2026-05-01', dateTo: '2026-05-08' })
        .expect(200);

      expect(mockByPaymentMethod.execute).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /api/v1/admin/pos/reports/by-staff ───────────────────────────

  describe('GET /api/v1/admin/pos/reports/by-staff', () => {
    it('should return staff sales report for SUPER_ADMIN', async () => {
      mockByStaff.execute.mockResolvedValue(
        fakeStaffReport('2026-05-01', '2026-05-08'),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-staff')
        .query({ dateFrom: '2026-05-01', dateTo: '2026-05-08' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].staffName).toBe('Ana');
      expect(mockByStaff.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2026-05-01',
          dateTo: '2026-05-08',
        }),
      );
    });

    it('should reject ADMIN role with 403 (super_admin only)', async () => {
      currentUser = ADMIN;

      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-staff')
        .query({ dateFrom: '2026-05-01', dateTo: '2026-05-08' })
        .expect(403);

      expect(mockByStaff.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-staff')
        .query({ dateFrom: 'bad', dateTo: '2026-05-08' })
        .expect(400);
      expect(mockByStaff.execute).not.toHaveBeenCalled();
    });

    it('should reject missing dateFrom', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/pos/reports/by-staff')
        .query({ dateTo: '2026-05-08' })
        .expect(400);
      expect(mockByStaff.execute).not.toHaveBeenCalled();
    });
  });
});
