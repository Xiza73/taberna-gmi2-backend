import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';
import { GetStaffMemberUseCase } from './get-staff-member.use-case';

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

describe('GetStaffMemberUseCase', () => {
  let useCase: GetStaffMemberUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetStaffMemberUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<GetStaffMemberUseCase>(GetStaffMemberUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return staff member when found', async () => {
    const staffId = '22222222-2222-2222-2222-222222222222';
    const staffMember = createTestStaff({
      id: staffId,
      name: 'Found Staff',
      email: 'found@example.com',
      role: StaffRole.ADMIN,
    });

    mockRepository.findById.mockResolvedValue(staffMember);

    const result = await useCase.execute(staffId);

    expect(mockRepository.findById).toHaveBeenCalledWith(staffId);
    expect(result).toBeInstanceOf(StaffMemberResponseDto);
    expect(result.id).toBe(staffId);
    expect(result.name).toBe('Found Staff');
    expect(result.email).toBe('found@example.com');
    expect(result.role).toBe(StaffRole.ADMIN);
    expect(result.isActive).toBe(true);
    expect(typeof result.createdAt).toBe('string');
  });

  it('should throw DomainNotFoundException when not found', async () => {
    const staffId = '99999999-9999-9999-9999-999999999999';
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(staffId)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(staffId)).rejects.toThrow(
      `StaffMember with id ${staffId} not found`,
    );
    expect(mockRepository.findById).toHaveBeenCalledWith(staffId);
  });
});
