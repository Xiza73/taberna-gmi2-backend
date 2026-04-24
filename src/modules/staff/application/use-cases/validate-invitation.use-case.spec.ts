import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcryptjs';

import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { ValidateInvitationResponseDto } from '../dtos/validate-invitation-response.dto';
import { ValidateInvitationUseCase } from './validate-invitation.use-case';

jest.mock('bcryptjs', () => ({
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

describe('ValidateInvitationUseCase', () => {
  let useCase: ValidateInvitationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateInvitationUseCase,
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockStaffRepo },
      ],
    }).compile();

    useCase = module.get<ValidateInvitationUseCase>(ValidateInvitationUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate invitation and return details', async () => {
    const invitation = createTestInvitation();
    const inviter = createTestStaff({ name: 'Super Admin' });
    const compositeToken = `${invitation.id}.raw-token-value`;

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);
    mockStaffRepo.findById.mockResolvedValue(inviter);

    const result = await useCase.execute(compositeToken);

    expect(result).toBeInstanceOf(ValidateInvitationResponseDto);
    expect(result.email).toBe('invited@example.com');
    expect(result.role).toBe(StaffRole.USER);
    expect(result.invitedByName).toBe('Super Admin');
    expect(mockInvitationRepo.findById).toHaveBeenCalledWith(invitation.id);
    expect(compare).toHaveBeenCalledWith('raw-token-value', invitation.tokenHash);
    expect(mockStaffRepo.findById).toHaveBeenCalledWith(invitation.invitedBy);
  });

  it('should throw DomainNotFoundException for invalid composite token format', async () => {
    const invalidToken = 'no-dot-separator';

    await expect(useCase.execute(invalidToken)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(invalidToken)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );

    expect(mockInvitationRepo.findById).not.toHaveBeenCalled();
  });

  it('should throw DomainNotFoundException when invitation not found', async () => {
    const compositeToken = 'nonexistent-id.raw-token-value';

    mockInvitationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );
  });

  it('should throw DomainNotFoundException when token does not match hash', async () => {
    const invitation = createTestInvitation();
    const compositeToken = `${invitation.id}.wrong-token`;

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );
  });

  it('should throw DomainException when invitation is revoked', async () => {
    const invitation = createTestInvitation({ isRevoked: true });
    const compositeToken = `${invitation.id}.raw-token-value`;

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      ErrorMessages.INVITATION_REVOKED,
    );
  });

  it('should throw DomainException when invitation is already accepted', async () => {
    const invitation = createTestInvitation({ acceptedAt: new Date() });
    const compositeToken = `${invitation.id}.raw-token-value`;

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      ErrorMessages.INVITATION_ALREADY_ACCEPTED,
    );
  });

  it('should throw DomainException when invitation is expired', async () => {
    const invitation = createTestInvitation({
      expiresAt: new Date(Date.now() - 1000),
    });
    const compositeToken = `${invitation.id}.raw-token-value`;

    mockInvitationRepo.findById.mockResolvedValue(invitation);
    (compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(compositeToken)).rejects.toThrow(
      ErrorMessages.INVITATION_EXPIRED,
    );
  });
});
