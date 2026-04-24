import { Test, TestingModule } from '@nestjs/testing';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { UpdateStaffMemberUseCase } from './update-staff-member.use-case';

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

describe('UpdateStaffMemberUseCase', () => {
  let useCase: UpdateStaffMemberUseCase;

  const staffId = '11111111-1111-1111-1111-111111111111';
  const currentUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStaffMemberUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<UpdateStaffMemberUseCase>(UpdateStaffMemberUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update name successfully', async () => {
    const staff = createTestStaff({ id: staffId });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      name: 'Updated Name',
    });

    expect(mockRepository.findById).toHaveBeenCalledWith(staffId);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.name).toBe('Updated Name');
  });

  it('should throw DomainNotFoundException when staff not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(staffId, currentUserId, { name: 'Updated Name' }),
    ).rejects.toThrow(DomainNotFoundException);
  });

  it('should change role successfully', async () => {
    const staff = createTestStaff({ id: staffId, role: StaffRole.USER });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      role: StaffRole.ADMIN,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.ADMIN);
  });

  it('should throw when trying to change own role', async () => {
    const sameId = staffId;
    const staff = createTestStaff({ id: sameId });
    mockRepository.findById.mockResolvedValue(staff);

    await expect(
      useCase.execute(sameId, sameId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(sameId, sameId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(ErrorMessages.STAFF_CANNOT_CHANGE_OWN_ROLE);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when demoting the last super_admin', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.SUPER_ADMIN,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(1);

    await expect(
      useCase.execute(staffId, currentUserId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(staffId, currentUserId, { role: StaffRole.ADMIN }),
    ).rejects.toThrow(ErrorMessages.STAFF_LAST_SUPER_ADMIN);

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should allow demoting super_admin when there are others', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.SUPER_ADMIN,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(2);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      role: StaffRole.ADMIN,
    });

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.role).toBe(StaffRole.ADMIN);
  });

  it('should suspend staff member via isActive=false', async () => {
    const staff = createTestStaff({ id: staffId, isActive: true });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      isActive: false,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.isActive).toBe(false);
  });

  it('should throw when trying to suspend self', async () => {
    const sameId = staffId;
    const staff = createTestStaff({ id: sameId, isActive: true });
    mockRepository.findById.mockResolvedValue(staff);

    await expect(
      useCase.execute(sameId, sameId, { isActive: false }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(sameId, sameId, { isActive: false }),
    ).rejects.toThrow(ErrorMessages.STAFF_CANNOT_SUSPEND_SELF);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when suspending last super_admin', async () => {
    const staff = createTestStaff({
      id: staffId,
      role: StaffRole.SUPER_ADMIN,
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.countByRole.mockResolvedValue(1);

    await expect(
      useCase.execute(staffId, currentUserId, { isActive: false }),
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(staffId, currentUserId, { isActive: false }),
    ).rejects.toThrow(ErrorMessages.STAFF_LAST_SUPER_ADMIN);

    expect(mockRepository.countByRole).toHaveBeenCalledWith(
      StaffRole.SUPER_ADMIN,
      true,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should activate staff member via isActive=true', async () => {
    const staff = createTestStaff({ id: staffId, isActive: false });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      isActive: true,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.isActive).toBe(true);
  });

  it('should handle multiple fields in one update (name + isActive)', async () => {
    const staff = createTestStaff({
      id: staffId,
      name: 'Old Name',
      isActive: true,
    });
    mockRepository.findById.mockResolvedValue(staff);
    mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await useCase.execute(staffId, currentUserId, {
      name: 'New Name',
      isActive: false,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.name).toBe('New Name');
    expect(result.isActive).toBe(false);
  });
});
