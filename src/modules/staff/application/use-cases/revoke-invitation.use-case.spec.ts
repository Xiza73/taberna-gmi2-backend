import { Test, TestingModule } from '@nestjs/testing';

import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_INVITATION_REPOSITORY } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { RevokeInvitationUseCase } from './revoke-invitation.use-case';

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

describe('RevokeInvitationUseCase', () => {
  let useCase: RevokeInvitationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokeInvitationUseCase,
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
      ],
    }).compile();

    useCase = module.get<RevokeInvitationUseCase>(RevokeInvitationUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should revoke invitation successfully', async () => {
    const invitation = createTestInvitation();
    mockInvitationRepo.findById.mockResolvedValue(invitation);
    mockInvitationRepo.save.mockImplementation(async (inv: StaffInvitation) => inv);

    await useCase.execute(invitation.id);

    expect(mockInvitationRepo.findById).toHaveBeenCalledWith(invitation.id);
    expect(mockInvitationRepo.save).toHaveBeenCalledTimes(1);

    const savedInvitation = mockInvitationRepo.save.mock.calls[0][0] as StaffInvitation;
    expect(savedInvitation.isRevoked).toBe(true);
  });

  it('should throw DomainNotFoundException when invitation not found', async () => {
    mockInvitationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
      ErrorMessages.INVITATION_NOT_FOUND,
    );

    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException when already revoked', async () => {
    const invitation = createTestInvitation({ isRevoked: true });
    mockInvitationRepo.findById.mockResolvedValue(invitation);

    await expect(useCase.execute(invitation.id)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(invitation.id)).rejects.toThrow(
      ErrorMessages.INVITATION_REVOKED,
    );

    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException when already accepted', async () => {
    const invitation = createTestInvitation({ acceptedAt: new Date() });
    mockInvitationRepo.findById.mockResolvedValue(invitation);

    await expect(useCase.execute(invitation.id)).rejects.toThrow(
      DomainException,
    );
    await expect(useCase.execute(invitation.id)).rejects.toThrow(
      ErrorMessages.INVITATION_ALREADY_ACCEPTED,
    );

    expect(mockInvitationRepo.save).not.toHaveBeenCalled();
  });
});
