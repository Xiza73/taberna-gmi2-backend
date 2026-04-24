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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { STAFF_MEMBER_REPOSITORY } from '@modules/staff/domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY } from '@modules/staff/domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '@modules/staff/domain/entities/staff-invitation.entity';
import { StaffMember } from '@modules/staff/domain/entities/staff-member.entity';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';
import {
  AdminInvitationsController,
  PublicInvitationsController,
} from '@modules/staff/presentation/staff-invitations.controller';
import { InviteStaffUseCase } from '@modules/staff/application/use-cases/invite-staff.use-case';
import { ListInvitationsUseCase } from '@modules/staff/application/use-cases/list-invitations.use-case';
import { RevokeInvitationUseCase } from '@modules/staff/application/use-cases/revoke-invitation.use-case';
import { ValidateInvitationUseCase } from '@modules/staff/application/use-cases/validate-invitation.use-case';
import { AcceptInvitationUseCase } from '@modules/staff/application/use-cases/accept-invitation.use-case';
import { EMAIL_SENDER } from '@modules/notifications/domain/interfaces/email-sender.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@modules/auth/domain/interfaces/refresh-token-repository.interface';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedtoken'),
  compare: jest.fn().mockResolvedValue(true),
}));

const SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

let currentUser = {
  id: SUPER_ADMIN_ID,
  email: 'admin@test.com',
  name: 'Super Admin',
  role: StaffRole.SUPER_ADMIN,
  subjectType: 'staff' as const,
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    req['user'] = { ...currentUser };
    return true;
  }
}

const mockStaffRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  countByRole: jest.fn(),
  withTransaction: jest.fn(),
};

const mockInvitationRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findPendingByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  withTransaction: jest.fn(),
};

const mockEmailSender = {
  sendStaffInvitation: jest.fn().mockResolvedValue(undefined),
};

const mockRefreshTokenRepo = {
  save: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('jwt-access-token'),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      BACKOFFICE_URL: 'http://localhost:5174',
      JWT_REFRESH_EXPIRATION: 604800,
    };
    return config[key] ?? defaultValue;
  }),
};

function createTestInvitation(overrides = {}) {
  return StaffInvitation.reconstitute({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'invited@example.com',
    role: StaffRole.USER,
    tokenHash: '$2a$12$hashedtoken',
    invitedBy: SUPER_ADMIN_ID,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    acceptedAt: null,
    isRevoked: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });
}

function createTestStaff(overrides = {}) {
  return StaffMember.reconstitute({
    id: SUPER_ADMIN_ID,
    name: 'Super Admin',
    email: 'admin@test.com',
    password: 'hashed',
    role: StaffRole.SUPER_ADMIN,
    isActive: true,
    invitedBy: null,
    googleId: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('Staff Invitations (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminInvitationsController, PublicInvitationsController],
      providers: [
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockStaffRepo },
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        InviteStaffUseCase,
        ListInvitationsUseCase,
        RevokeInvitationUseCase,
        ValidateInvitationUseCase,
        AcceptInvitationUseCase,
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
    currentUser = {
      id: SUPER_ADMIN_ID,
      email: 'admin@test.com',
      name: 'Super Admin',
      role: StaffRole.SUPER_ADMIN,
      subjectType: 'staff' as const,
    };
  });

  // ── POST /api/v1/admin/staff/invitations ──

  describe('POST /api/v1/admin/staff/invitations', () => {
    it('should create invitation', async () => {
      const invitation = createTestInvitation();
      mockStaffRepo.findByEmail.mockResolvedValue(null);
      mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
      mockInvitationRepo.save.mockResolvedValue(invitation);
      mockStaffRepo.findById.mockResolvedValue(createTestStaff());

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff/invitations')
        .send({ email: 'invited@example.com', role: 'user' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email', 'invited@example.com');
      expect(res.body.data).toHaveProperty('role', 'user');
      expect(mockEmailSender.sendStaffInvitation).toHaveBeenCalled();
    });

    it('should return 409 when email already exists as staff', async () => {
      mockStaffRepo.findByEmail.mockResolvedValue(createTestStaff());

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff/invitations')
        .send({ email: 'admin@test.com', role: 'user' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/staff/invitations')
        .send({})
        .expect(400);
    });
  });

  // ── GET /api/v1/admin/staff/invitations ──

  describe('GET /api/v1/admin/staff/invitations', () => {
    it('should list pending invitations', async () => {
      const invitation = createTestInvitation();
      mockInvitationRepo.findAll.mockResolvedValue({
        items: [invitation],
        total: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/staff/invitations')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0]).toHaveProperty(
        'email',
        'invited@example.com',
      );
    });
  });

  // ── DELETE /api/v1/admin/staff/invitations/:id ──

  describe('DELETE /api/v1/admin/staff/invitations/:id', () => {
    it('should revoke invitation', async () => {
      const invitation = createTestInvitation();
      mockInvitationRepo.findById.mockResolvedValue(invitation);
      mockInvitationRepo.save.mockResolvedValue(invitation);

      const res = await request(app.getHttpServer())
        .delete('/api/v1/admin/staff/invitations/11111111-1111-1111-1111-111111111111')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockInvitationRepo.save).toHaveBeenCalled();
    });

    it('should return 404 when not found', async () => {
      mockInvitationRepo.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(
          '/api/v1/admin/staff/invitations/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        )
        .expect(404);
    });
  });

  // ── GET /api/v1/staff/invitations/:token/validate ──

  describe('GET /api/v1/staff/invitations/:token/validate', () => {
    it('should validate token and return invitation info', async () => {
      const invitation = createTestInvitation();
      const inviter = createTestStaff();
      mockInvitationRepo.findById.mockResolvedValue(invitation);
      mockStaffRepo.findById.mockResolvedValue(inviter);

      const res = await request(app.getHttpServer())
        .get('/api/v1/staff/invitations/11111111-1111-1111-1111-111111111111.raw-token/validate')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'invited@example.com');
      expect(res.body.data).toHaveProperty('role', 'user');
      expect(res.body.data).toHaveProperty('invitedByName', 'Super Admin');
    });

    it('should return 404 for invalid token', async () => {
      mockInvitationRepo.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/staff/invitations/invalid-id.bad-token/validate')
        .expect(404);
    });
  });

  // ── POST /api/v1/staff/invitations/:token/accept ──

  describe('POST /api/v1/staff/invitations/:token/accept', () => {
    it('should accept invitation and return auth tokens', async () => {
      const invitation = createTestInvitation();
      const savedStaff = createTestStaff({
        id: 'new-staff-id',
        email: 'invited@example.com',
        name: 'New Staff',
        role: StaffRole.USER,
      });

      mockInvitationRepo.findById.mockResolvedValue(invitation);
      mockStaffRepo.findByEmail.mockResolvedValue(null);
      mockStaffRepo.save.mockResolvedValue(savedStaff);
      mockInvitationRepo.save.mockResolvedValue(invitation);
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'refresh-id-123' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/staff/invitations/11111111-1111-1111-1111-111111111111.raw-token/accept')
        .send({ name: 'New Staff', password: 'securePassword123' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken', 'jwt-access-token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.refreshToken).toContain('refresh-id-123');
      expect(mockStaffRepo.save).toHaveBeenCalled();
      expect(mockInvitationRepo.save).toHaveBeenCalled();
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/staff/invitations/11111111-1111-1111-1111-111111111111.raw-token/accept')
        .send({})
        .expect(400);
    });
  });
});
