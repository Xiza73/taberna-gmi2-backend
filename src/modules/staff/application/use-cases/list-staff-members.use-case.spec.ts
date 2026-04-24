import { Test, TestingModule } from '@nestjs/testing';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { STAFF_MEMBER_REPOSITORY } from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';
import { ListStaffMembersUseCase } from './list-staff-members.use-case';

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

describe('ListStaffMembersUseCase', () => {
  let useCase: ListStaffMembersUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListStaffMembersUseCase,
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ListStaffMembersUseCase>(ListStaffMembersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated staff members', async () => {
    const staff1 = createTestStaff({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Staff One',
      email: 'one@example.com',
    });
    const staff2 = createTestStaff({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Staff Two',
      email: 'two@example.com',
      role: StaffRole.ADMIN,
    });

    mockRepository.findAll.mockResolvedValue({
      items: [staff1, staff2],
      total: 2,
    });

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      isActive: undefined,
      role: undefined,
    });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toBeInstanceOf(StaffMemberResponseDto);
    expect(result.items[1]).toBeInstanceOf(StaffMemberResponseDto);
    expect(result.items[0].name).toBe('Staff One');
    expect(result.items[1].name).toBe('Staff Two');
  });

  it('should pass default pagination when not provided', async () => {
    mockRepository.findAll.mockResolvedValue({ items: [], total: 0 });

    const result = await useCase.execute({});

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      isActive: undefined,
      role: undefined,
    });
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should pass search, isActive and role filters', async () => {
    const staff = createTestStaff({
      name: 'Admin User',
      role: StaffRole.ADMIN,
      isActive: true,
    });

    mockRepository.findAll.mockResolvedValue({ items: [staff], total: 1 });

    const result = await useCase.execute({
      page: 2,
      limit: 5,
      search: 'Admin',
      isActive: true,
      role: StaffRole.ADMIN,
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      search: 'Admin',
      isActive: true,
      role: StaffRole.ADMIN,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Admin User');
    expect(result.items[0].role).toBe(StaffRole.ADMIN);
  });
});
