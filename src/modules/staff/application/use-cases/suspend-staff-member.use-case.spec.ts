import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { SuspendStaffMemberUseCase } from './suspend-staff-member.use-case';

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

describe('SuspendStaffMemberUseCase', () => {
  let useCase: SuspendStaffMemberUseCase;

  const staffId = '11111111-1111-1111-1111-111111111111';
  const currentUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuspendStaffMemberUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<SuspendStaffMemberUseCase>(SuspendStaffMemberUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should suspend staff member successfully', async () => {
    const staff = createTestStaff({ id: staffId, isActive: true });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    await useCase.execute(staffId, currentUserId);

    expect(mockRepository.findById).toHaveBeenCalledWith(staffId);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('should throw when trying to suspend self', async () => {
    const sameId = staffId;

    await expect(useCase.execute(sameId, sameId)).rejects.toThrow(
      DomainException,
    );

    await expect(useCase.execute(sameId, sameId)).rejects.toThrow(
      ErrorMessages.STAFF_CANNOT_SUSPEND_SELF,
    );

    expect(mockRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw DomainNotFoundException when staff not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(staffId, currentUserId)).rejects.toThrow(
      DomainNotFoundException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when suspending the last active super_admin', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.SUPER_ADMIN,
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(1);

    await expect(useCase.execute(staffId, currentUserId)).rejects.toThrow(
      DomainException,
    );

    await expect(useCase.execute(staffId, currentUserId)).rejects.toThrow(
      ErrorMessages.STAFF_LAST_SUPER_ADMIN,
    );

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should allow suspending super_admin when there are others', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.SUPER_ADMIN,
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(2);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    await useCase.execute(staffId, currentUserId);

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('should suspend admin without checking super_admin count', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.ADMIN,
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    await useCase.execute(staffId, currentUserId);

    expect(mockRepository.countByRole).not.toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('should suspend user without checking super_admin count', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.USER,
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    await useCase.execute(staffId, currentUserId);

    expect(mockRepository.countByRole).not.toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});
