import { Test, TestingModule } from '@nestjs/testing';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_INVITATION_REPOSITORY } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { StaffInvitationResponseDto } from '../dtos/staff-invitation-response.dto';
import { ListInvitationsUseCase } from './list-invitations.use-case';

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

describe('ListInvitationsUseCase', () => {
  let useCase: ListInvitationsUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListInvitationsUseCase,
        { provide: STAFF_INVITATION_REPOSITORY, useValue: mockInvitationRepo },
      ],
    }).compile();

    useCase = module.get<ListInvitationsUseCase>(ListInvitationsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated invitations', async () => {
    const invitation1 = createTestInvitation({
      id: 'inv-11111111-1111-1111-1111-111111111111',
      email: 'user1@example.com',
    });
    const invitation2 = createTestInvitation({
      id: 'inv-22222222-2222-2222-2222-222222222222',
      email: 'user2@example.com',
      role: StaffRole.ADMIN,
    });

    mockInvitationRepo.findAll.mockResolvedValue({
      items: [invitation1, invitation2],
      total: 5,
    });

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(mockInvitationRepo.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toBeInstanceOf(StaffInvitationResponseDto);
    expect(result.items[0].email).toBe('user1@example.com');
    expect(result.items[1]).toBeInstanceOf(StaffInvitationResponseDto);
    expect(result.items[1].email).toBe('user2@example.com');
    expect(result.items[1].role).toBe(StaffRole.ADMIN);
  });

  it('should use default pagination when not provided', async () => {
    mockInvitationRepo.findAll.mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({});

    expect(mockInvitationRepo.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
