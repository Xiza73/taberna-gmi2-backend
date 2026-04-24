import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { DomainConflictException, DomainForbiddenException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { EMAIL_SENDER } from '@modules/notifications/domain/interfaces/email-sender.interface';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { StaffInvitationResponseDto } from '../dtos/staff-invitation-response.dto';
import { InviteStaffUseCase } from './invite-staff.use-case';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedtoken'),
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

const mockEmailSender = {
  sendStaffInvitation: jest.fn().mockResolvedValue(undefined),
  sendWelcome: jest.fn(),
  sendOrderConfirmation: jest.fn(),
  sendPaymentConfirmed: jest.fn(),
  sendOrderShipped: jest.fn(),
  sendOrderDelivered: jest.fn(),
  sendPasswordReset: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:5174'),
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

describe('InviteStaffUseCase', () => {
  let useCase: InviteStaffUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteStaffUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockStaffRepo },
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<InviteStaffUseCase>(InviteStaffUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create invitation successfully when SUPER_ADMIN invites USER', async () => {
    const dto = { email: 'newuser@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const currentUserRole = StaffRole.SUPER_ADMIN;

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockStaffRepo.findById.mockResolvedValue(createTestStaff());

    const result = await useCase.execute(dto, currentUserId, currentUserRole);

    expect(result).toBeInstanceOf(StaffInvitationResponseDto);
    expect(result.email).toBe('newuser@example.com');
    expect(result.role).toBe(StaffRole.USER);
    expect(mockStaffRepo.findByEmail).toHaveBeenCalledWith('newuser@example.com');
    expect(mockInvitationRepo.findPendingByEmail).toHaveBeenCalledWith('newuser@example.com');
    expect(mockInvitationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create invitation successfully when SUPER_ADMIN invites ADMIN', async () => {
    const dto = { email: 'newadmin@example.com', role: StaffRole.ADMIN };
    const currentUserId = 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const currentUserRole = StaffRole.SUPER_ADMIN;

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockStaffRepo.findById.mockResolvedValue(createTestStaff());

    const result = await useCase.execute(dto, currentUserId, currentUserRole);

    expect(result).toBeInstanceOf(StaffInvitationResponseDto);
    expect(result.email).toBe('newadmin@example.com');
    expect(result.role).toBe(StaffRole.ADMIN);
    expect(mockInvitationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create invitation successfully when ADMIN invites USER', async () => {
    const dto = { email: 'newuser@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const currentUserRole = StaffRole.ADMIN;

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockStaffRepo.findById.mockResolvedValue(
      createTestStaff({ id: currentUserId, role: StaffRole.ADMIN, name: 'Admin User' }),
    );

    const result = await useCase.execute(dto, currentUserId, currentUserRole);

    expect(result).toBeInstanceOf(StaffInvitationResponseDto);
    expect(result.role).toBe(StaffRole.USER);
  });

  it('should throw DomainForbiddenException when ADMIN tries to invite ADMIN', async () => {
    const dto = { email: 'another-admin@example.com', role: StaffRole.ADMIN };
    const currentUserId = 'staff-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const currentUserRole = StaffRole.ADMIN;

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(DomainForbiddenException);

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(ErrorMessages.INVITATION_CANNOT_INVITE_ROLE);

    expect(mockStaffRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainForbiddenException when USER tries to invite', async () => {
    const dto = { email: 'someone@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-cccccccc-cccc-cccc-cccc-cccccccccccc';
    const currentUserRole = StaffRole.USER;

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(DomainForbiddenException);

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(ErrorMessages.INVITATION_CANNOT_INVITE_ROLE);

    expect(mockStaffRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainConflictException when email already belongs to existing staff', async () => {
    const dto = { email: 'existing@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const currentUserRole = StaffRole.SUPER_ADMIN;

    mockStaffRepo.findByEmail.mockResolvedValue(
      createTestStaff({ email: 'existing@example.com' }),
    );

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(DomainConflictException);

    await expect(
      useCase.execute(dto, currentUserId, currentUserRole),
    ).rejects.toThrow(ErrorMessages.INVITATION_EMAIL_EXISTS);

    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });

  it('should revoke existing pending invitation for same email before creating new one', async () => {
    const dto = { email: 'invited@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const currentUserRole = StaffRole.SUPER_ADMIN;

    const existingPendingInvitation = createTestInvitation({
      email: 'invited@example.com',
    });

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(existingPendingInvitation);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockStaffRepo.findById.mockResolvedValue(createTestStaff());

    await useCase.execute(dto, currentUserId, currentUserRole);

    // save is called twice: once for revoking old invitation, once for new one
    expect(mockInvitationRepo.save).toHaveBeenCalledTimes(2);

    // First call should be saving the revoked invitation
    const revokedInvitation = mockInvitationRepo.save.mock.calls[0][0] as StaffInvitation;
    expect(revokedInvitation.isRevoked).toBe(true);

    // Second call should be the new invitation
    const newInvitation = mockInvitationRepo.save.mock.calls[1][0] as StaffInvitation;
    expect(newInvitation.email).toBe('invited@example.com');
    expect(newInvitation.isRevoked).toBe(false);
  });

  it('should send invitation email after creating', async () => {
    const dto = { email: 'newuser@example.com', role: StaffRole.USER };
    const currentUserId = 'staff-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const currentUserRole = StaffRole.SUPER_ADMIN;

    const inviter = createTestStaff({ name: 'Super Admin' });

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);
    mockStaffRepo.findById.mockResolvedValue(inviter);

    await useCase.execute(dto, currentUserId, currentUserRole);

    expect(mockEmailSender.sendStaffInvitation).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.sendStaffInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newuser@example.com',
        role: StaffRole.USER,
        invitedByName: 'Super Admin',
        invitationUrl: expect.stringContaining('http://localhost:5174/staff/register?token='),
      }),
    );
  });
});
