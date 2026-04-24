import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';

import {
  DomainConflictException,
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { REFRESH_TOKEN_REPOSITORY } from '@modules/auth/domain/interfaces/refresh-token-repository.interface';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashed'),
  compare: jest.fn(),
}));

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

const mockRefreshTokenRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
  revokeByFamily: jest.fn(),
  revokeAllByUser: jest.fn(),
  deleteExpiredAndRevoked: jest.fn(),
  withTransaction: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('jwt-access-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(604800),
};

function createTestInvitation(overrides = {}) {
  return StaffInvitation.reconstitute({
    id: 'inv-11111111-1111-1111-1111-111111111111',
    email: 'invited@example.com',
    role: StaffRole.USER,
    tokenHash: '$2a$12$hashedtoken',
    invitedBy: 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    acceptedAt: null,
    isRevoked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function createTestStaff(overrides = {}) {
  return StaffMember.reconstitute({
    id: 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Test Admin',
    email: 'admin@example.com',
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

describe('AcceptInvitationUseCase', () => {
  let useCase: AcceptInvitationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptInvitationUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockStaffRepo },
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<AcceptInvitationUseCase>(AcceptInvitationUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should accept invitation, create staff, and return auth tokens', async () => {
    const invitation = createTestInvitation();
    const compositeToken = `${invitation.id}.raw-token-value`;
    const dto = { name: 'New Staff Member', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);
    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockStaffRepo.save.mockImplementation(async (staff: StaffMember) => staff);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockRefreshTokenRepo.save.mockImplementation(async (token: any) => {
      const result = { ...token };
      Object.defineProperty(result, 'id', { value: 'refresh-token-id', enumerable: true });
      return result;
    });

    const result = await useCase.execute(compositeToken, dto);

    // Should return auth tokens
    expect(result.accessToken).toBe('jwt-access-token');
    expect(result.refreshToken).toContain('refresh-token-id.');

    // Should have found the invitation
    expect(mockInvitationRepo.findById).toHaveBeenCalledWith(invitation.id);
    expect(compare).toHaveBeenCalledWith('raw-token-value', invitation.tokenHash);

    // Should have checked email uniqueness
    expect(mockStaffRepo.findByEmail).toHaveBeenCalledWith(invitation.email);

    // Should have created a staff member
    expect(mockStaffRepo.save).toHaveBeenCalledTimes(1);
    const savedStaff = mockStaffRepo.save.mock.calls[0][0] as StaffMember;
    expect(savedStaff.name).toBe('New Staff Member');
    expect(savedStaff.email).toBe('invited@example.com');
    expect(savedStaff.role).toBe(StaffRole.USER);
    expect(savedStaff.password).toBe('$2a$12$hashed');

    // Should have marked invitation as accepted
    expect(mockInvitationRepo.save).toHaveBeenCalledTimes(1);
    const acceptedInvitation = mockInvitationRepo.save.mock.calls[0][0] as StaffInvitation;
    expect(acceptedInvitation.acceptedAt).not.toBeNull();

    // Should have generated JWT
    expect(mockJwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: savedStaff.id,
        email: savedStaff.email,
        name: savedStaff.name,
        role: 'staff',
        subjectType: 'staff',
      }),
    );

    // Should have saved refresh token
    expect(mockRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw DomainNotFoundException for invalid token format', async () => {
    const invalidToken = 'no-dot-separator';
    const dto = { name: 'New Staff', password: 'securePassword123' };

    await expect(useCase.execute(invalidToken, dto)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(invalidToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );

    expect(mockInvitationRepo.findById).not.toHaveBeenCalled();
  });

  it('should throw DomainNotFoundException when invitation not found', async () => {
    const compositeToken = 'nonexistent-id.raw-token-value';
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );
  });

  it('should throw DomainNotFoundException when token does not match', async () => {
    const invitation = createTestInvitation();
    const compositeToken = `${invitation.id}.wrong-token`;
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );

    expect(mockStaffRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException when invitation expired', async () => {
    const invitation = createTestInvitation({
      expiresAt: new Date(Date.now() - 1000),
    });
    const compositeToken = `${invitation.id}.raw-token-value`;
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_EXPIRED,
    );

    expect(mockStaffRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException when invitation is revoked', async () => {
    const invitation = createTestInvitation({ isRevoked: true });
    const compositeToken = `${invitation.id}.raw-token-value`;
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_REVOKED,
    );

    expect(mockStaffRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException when invitation is already accepted', async () => {
    const invitation = createTestInvitation({ acceptedAt: new Date() });
    const compositeToken = `${invitation.id}.raw-token-value`;
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.INVITATION_ALREADY_ACCEPTED,
    );

    expect(mockStaffRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainConflictException when email already taken by existing staff', async () => {
    const invitation = createTestInvitation();
    const compositeToken = `${invitation.id}.raw-token-value`;
    const dto = { name: 'New Staff', password: 'securePassword123' };

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);
    mockStaffRepo.findByEmail.mockResolvedValue(
      createTestStaff({ email: 'invited@example.com' }),
    );

    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      DomainConflictException,
    );
    await expect(useCase.execute(compositeToken, dto)).rejects.toThrow(
      ErrorMessages.STAFF_EMAIL_ALREADY_EXISTS,
    );

    expect(mockStaffRepo.save).not.toHaveBeenCalled();
  });
});
