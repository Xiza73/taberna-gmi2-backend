import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { ActivateStaffMemberUseCase } from './activate-staff-member.use-case';

const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  countByRole: jest.fn(),
  withTransaction: jest.fn(),
};

function createTestStaff(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    isActive: boolean;
  }> = {},
) {
  return StaffMember.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    name: overrides.name ?? 'Test Staff',
    email: overrides.email ?? 'test@example.com',
    password: overrides.password ?? 'hashedPassword123',
    role: overrides.role ?? StaffRole.USER,
    isActive: overrides.isActive ?? true,
    invitedBy: null,
    googleId: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ActivateStaffMemberUseCase', () => {
  let useCase: ActivateStaffMemberUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivateStaffMemberUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ActivateStaffMemberUseCase>(
      ActivateStaffMemberUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should activate staff member successfully', async () => {
    const staffId = '33333333-3333-3333-3333-333333333333';
    const suspendedStaff = createTestStaff({
      id: staffId,
      isActive: false,
    });

    mockRepository.findById.mockResolvedValue(suspendedStaff);
    mockRepository.save.mockImplementation(async (staff: StaffMember) => staff);

    await useCase.execute(staffId);

    expect(mockRepository.findById).toHaveBeenCalledWith(staffId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);

    const savedStaff = mockRepository.save.mock.calls[0][0] as StaffMember;
    expect(savedStaff.isActive).toBe(true);
  });

  it('should throw DomainNotFoundException when staff not found', async () => {
    const staffId = '99999999-9999-9999-9999-999999999999';
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(staffId)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(staffId)).rejects.toThrow(
      `StaffMember with id ${staffId} not found`,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
