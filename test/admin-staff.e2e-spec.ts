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
import { STAFF_MEMBER_REPOSITORY } from '@modules/staff/domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '@modules/staff/domain/entities/staff-member.entity';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';
import { AdminStaffController } from '@modules/staff/presentation/admin-staff.controller';
import { CreateStaffMemberUseCase } from '@modules/staff/application/use-cases/create-staff-member.use-case';
import { ListStaffMembersUseCase } from '@modules/staff/application/use-cases/list-staff-members.use-case';
import { GetStaffMemberUseCase } from '@modules/staff/application/use-cases/get-staff-member.use-case';
import { UpdateStaffMemberUseCase } from '@modules/staff/application/use-cases/update-staff-member.use-case';
import { SuspendStaffMemberUseCase } from '@modules/staff/application/use-cases/suspend-staff-member.use-case';
import { ActivateStaffMemberUseCase } from '@modules/staff/application/use-cases/activate-staff-member.use-case';
import { ChangeStaffRoleUseCase } from '@modules/staff/application/use-cases/change-staff-role.use-case';

const SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ADMIN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_STAFF_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

let currentUser = {
  id: SUPER_ADMIN_ID,
  email: 'superadmin@test.com',
  name: 'Super Admin',
  role: StaffRole.SUPER_ADMIN,
  subjectType: 'staff' as const,
};

function setCurrentUser(override: Partial<typeof currentUser>) {
  currentUser = { ...currentUser, ...override };
}

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    req['user'] = { ...currentUser };
    return true;
  }
}

function createStaff(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    isActive: boolean;
  }> = {},
) {
  return StaffMember.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    name: overrides.name ?? 'Test Staff',
    email: overrides.email ?? 'test@example.com',
    password: 'hashed',
    role: overrides.role ?? StaffRole.USER,
    isActive: overrides.isActive ?? true,
    invitedBy: null,
    googleId: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  countByRole: jest.fn(),
  withTransaction: jest.fn(),
};

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('AdminStaffController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminStaffController],
      providers: [
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
        CreateStaffMemberUseCase,
        ListStaffMembersUseCase,
        GetStaffMemberUseCase,
        UpdateStaffMemberUseCase,
        SuspendStaffMemberUseCase,
        ActivateStaffMemberUseCase,
        ChangeStaffRoleUseCase,
      ],
    })
      .overrideGuard(MockJwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

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
          const messages = errors.flatMap((e) =>
            Object.values(e.constraints || {}),
          );
          throw new BadRequestException(messages);
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
    setCurrentUser({
      id: SUPER_ADMIN_ID,
      role: StaffRole.SUPER_ADMIN,
      subjectType: 'staff',
    });
  });

  // ── POST /api/v1/admin/staff ──

  describe('POST /api/v1/admin/staff', () => {
    it('should create a staff member with default role', async () => {
      const staff = createStaff({ email: 'new@example.com', name: 'New Staff' });
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(staff);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .send({ name: 'New Staff', email: 'new@example.com', password: 'password123' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'New Staff');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should create a staff member with specific role', async () => {
      const staff = createStaff({ role: StaffRole.ADMIN });
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(staff);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .send({
          name: 'Admin Staff',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should return 409 when email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(createStaff());

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .send({ name: 'Dup', email: 'test@example.com', password: 'password123' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .send({ name: '' })
        .expect(400);
    });

    it('should reject invalid role enum value', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .send({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid_role',
        })
        .expect(400);
    });
  });

  // ── GET /api/v1/admin/staff ──

  describe('GET /api/v1/admin/staff', () => {
    it('should return paginated staff list', async () => {
      const staff = createStaff();
      mockRepository.findAll.mockResolvedValue({ items: [staff], total: 1 });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/staff')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should pass role filter', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/api/v1/admin/staff?role=admin')
        .expect(200);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ role: StaffRole.ADMIN }),
      );
    });

    it('should pass isActive filter', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/api/v1/admin/staff?isActive=true')
        .expect(200);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });

    it('should pass search filter', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/api/v1/admin/staff?search=john')
        .expect(200);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' }),
      );
    });
  });

  // ── GET /api/v1/admin/staff/:id ──

  describe('GET /api/v1/admin/staff/:id', () => {
    it('should return staff member by id', async () => {
      const staff = createStaff({ id: ADMIN_ID, name: 'Admin' });
      mockRepository.findById.mockResolvedValue(staff);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/staff/${ADMIN_ID}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(ADMIN_ID);
    });

    it('should return 404 when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/admin/staff/${ADMIN_ID}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/staff/not-a-uuid')
        .expect(400);
    });
  });

  // ── PATCH /api/v1/admin/staff/:id ──

  describe('PATCH /api/v1/admin/staff/:id', () => {
    it('should update staff name', async () => {
      const staff = createStaff({ id: ADMIN_ID, name: 'Old Name' });
      const updated = createStaff({ id: ADMIN_ID, name: 'New Name' });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
    });

    it('should update staff role', async () => {
      const staff = createStaff({ id: USER_STAFF_ID, role: StaffRole.USER });
      const updated = createStaff({ id: USER_STAFF_ID, role: StaffRole.ADMIN });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should suspend via isActive=false', async () => {
      const staff = createStaff({
        id: USER_STAFF_ID,
        role: StaffRole.USER,
        isActive: true,
      });
      const updated = createStaff({
        id: USER_STAFF_ID,
        isActive: false,
      });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 400 when trying to change own role', async () => {
      const staff = createStaff({ id: SUPER_ADMIN_ID });
      mockRepository.findById.mockResolvedValue(staff);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${SUPER_ADMIN_ID}`)
        .send({ role: 'user' })
        .expect(400);
    });

    it('should return 400 when trying to suspend self', async () => {
      const staff = createStaff({ id: SUPER_ADMIN_ID, isActive: true });
      mockRepository.findById.mockResolvedValue(staff);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${SUPER_ADMIN_ID}`)
        .send({ isActive: false })
        .expect(400);
    });

    it('should return 404 when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  // ── PATCH /api/v1/admin/staff/:id/role ──

  describe('PATCH /api/v1/admin/staff/:id/role', () => {
    it('should change staff role', async () => {
      const staff = createStaff({ id: USER_STAFF_ID, role: StaffRole.USER });
      const updated = createStaff({ id: USER_STAFF_ID, role: StaffRole.ADMIN });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}/role`)
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
    });

    it('should return 400 when trying to change own role', async () => {
      mockRepository.findById.mockResolvedValue(
        createStaff({ id: SUPER_ADMIN_ID }),
      );

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${SUPER_ADMIN_ID}/role`)
        .send({ role: 'user' })
        .expect(400);
    });

    it('should return 400 when demoting last super_admin', async () => {
      const staff = createStaff({
        id: ADMIN_ID,
        role: StaffRole.SUPER_ADMIN,
      });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.countByRole.mockResolvedValue(1);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}/role`)
        .send({ role: 'admin' })
        .expect(400);
    });

    it('should return 404 when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}/role`)
        .send({ role: 'admin' })
        .expect(404);
    });

    it('should return 400 for invalid role value', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}/role`)
        .send({ role: 'superuser' })
        .expect(400);
    });
  });

  // ── PATCH /api/v1/admin/staff/:id/suspend ──

  describe('PATCH /api/v1/admin/staff/:id/suspend', () => {
    it('should suspend staff member', async () => {
      const staff = createStaff({
        id: USER_STAFF_ID,
        role: StaffRole.USER,
      });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(staff);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}/suspend`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 when trying to suspend self', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${SUPER_ADMIN_ID}/suspend`)
        .expect(400);
    });

    it('should return 400 when suspending last super_admin', async () => {
      const staff = createStaff({
        id: ADMIN_ID,
        role: StaffRole.SUPER_ADMIN,
      });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.countByRole.mockResolvedValue(1);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${ADMIN_ID}/suspend`)
        .expect(400);
    });

    it('should return 404 when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}/suspend`)
        .expect(404);
    });
  });

  // ── PATCH /api/v1/admin/staff/:id/activate ──

  describe('PATCH /api/v1/admin/staff/:id/activate', () => {
    it('should activate staff member', async () => {
      const staff = createStaff({
        id: USER_STAFF_ID,
        isActive: false,
      });
      mockRepository.findById.mockResolvedValue(staff);
      mockRepository.save.mockResolvedValue(staff);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}/activate`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/staff/${USER_STAFF_ID}/activate`)
        .expect(404);
    });
  });
});
