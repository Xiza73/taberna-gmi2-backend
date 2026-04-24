import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { ChangeStaffRoleUseCase } from './change-staff-role.use-case';

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

describe('ChangeStaffRoleUseCase', () => {
  let useCase: ChangeStaffRoleUseCase;

  const targetId = '11111111-1111-1111-1111-111111111111';
  const currentUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeStaffRoleUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ChangeStaffRoleUseCase>(ChangeStaffRoleUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should change role successfully (user to admin)', async () => {
    const staff = createTestStaff({ id: targetId, role: StaffRole.USER });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(targetId, currentUserId, {
      role: StaffRole.ADMIN,
    });

    expect(mockRepository.findById).toHaveBeenCalledWith(targetId);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.ADMIN);
  });

  it('should change role successfully (admin to super_admin)', async () => {
    const staff = createTestStaff({ id: targetId, role: StaffRole.ADMIN });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(targetId, currentUserId, {
      role: StaffRole.SUPER_ADMIN,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.SUPER_ADMIN);
    expect(mockRepository.countByRole).not.toHaveBeenCalled();
  });

  it('should throw when trying to change own role', async () => {
    const sameId = targetId;

    await expect(
      useCase.execute(sameId, sameId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(sameId, sameId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(ErrorMessages.STAFF_CANNOT_CHANGE_OWN_ROLE);

    expect(mockRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw DomainNotFoundException when staff not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(targetId, currentUserId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(DomainNotFoundException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when demoting the last super_admin', async () => {
    const staff = createTestStaff({
      id: targetId,
      role: StaffRole.SUPER_ADMIN,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(1);

    await expect(
      useCase.execute(targetId, currentUserId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(targetId, currentUserId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(ErrorMessages.STAFF_LAST_SUPER_ADMIN);

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should allow demoting super_admin when there are multiple (count > 1)', async () => {
    const staff = createTestStaff({
      id: targetId,
      role: StaffRole.SUPER_ADMIN,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(3);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(targetId, currentUserId, {
      role: StaffRole.USER,
    });

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.USER);
  });

  it('should allow changing super_admin role to super_admin (same role, no demotion check needed)', async () => {
    const staff = createTestStaff({
      id: targetId,
      role: StaffRole.SUPER_ADMIN,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(targetId, currentUserId, {
      role: StaffRole.SUPER_ADMIN,
    });

    expect(mockRepository.countByRole).not.toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.SUPER_ADMIN);
  });
});
