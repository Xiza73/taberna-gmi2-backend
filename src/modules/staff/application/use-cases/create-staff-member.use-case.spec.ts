import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';

import { DomainConflictException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';
import { CreateStaffMemberUseCase } from './create-staff-member.use-case';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

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

describe('CreateStaffMemberUseCase', () => {
  let useCase: CreateStaffMemberUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStaffMemberUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<CreateStaffMemberUseCase>(CreateStaffMemberUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a staff member successfully with default role (USER)', async () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plainPassword123',
    };

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockImplementation(async (staff: StaffMember) => staff);

    const result = await useCase.execute(dto);

    expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);

    const savedStaff = mockRepository.save.mock.calls[0][0] as StaffMember;
    expect(savedStaff.role).toBe(StaffRole.USER);

    expect(result).toBeInstanceOf(StaffMemberResponseDto);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.role).toBe(StaffRole.USER);
    expect(result.isActive).toBe(true);
  });

  it('should create a staff member with a specific role (ADMIN)', async () => {
    const dto = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'plainPassword123',
      role: StaffRole.ADMIN,
    };

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockImplementation(async (staff: StaffMember) => staff);

    const result = await useCase.execute(dto);

    const savedStaff = mockRepository.save.mock.calls[0][0] as StaffMember;
    expect(savedStaff.role).toBe(StaffRole.ADMIN);
    expect(result.role).toBe(StaffRole.ADMIN);
  });

  it('should throw DomainConflictException if email already exists', async () => {
    const dto = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'plainPassword123',
    };

    const existingStaff = createTestStaff({ email: 'existing@example.com' });
    mockRepository.findByEmail.mockResolvedValue(existingStaff);

    await expect(useCase.execute(dto)).rejects.toThrow(
      DomainConflictException,
    );
    await expect(useCase.execute(dto)).rejects.toThrow(
      ErrorMessages.EMAIL_ALREADY_EXISTS,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should hash the password before saving', async () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plainPassword123',
    };

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockImplementation(async (staff: StaffMember) => staff);

    await useCase.execute(dto);

    expect(hash).toHaveBeenCalledWith('plainPassword123', 12);

    const savedStaff = mockRepository.save.mock.calls[0][0] as StaffMember;
    expect(savedStaff.password).toBe('hashedPassword');
    expect(savedStaff.password).not.toBe('plainPassword123');
  });

  it('should return StaffMemberResponseDto with correct fields', async () => {
    const dto = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'securePass456',
      role: StaffRole.SUPER_ADMIN,
    };

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockImplementation(async (staff: StaffMember) => staff);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(StaffMemberResponseDto);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', 'Jane Smith');
    expect(result).toHaveProperty('email', 'jane@example.com');
    expect(result).toHaveProperty('role', StaffRole.SUPER_ADMIN);
    expect(result).toHaveProperty('isActive', true);
    expect(result).toHaveProperty('invitedBy');
    expect(result).toHaveProperty('createdAt');
    expect(typeof result.createdAt).toBe('string');
    // password should NOT be in the response
    expect(result).not.toHaveProperty('password');
  });
});
