import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { StaffMember } from '@modules/staff/domain/entities/staff-member.entity';
import { STAFF_MEMBER_REPOSITORY } from '@modules/staff/domain/interfaces/staff-member-repository.interface';

import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';
import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';

import { ListCashRegistersUseCase } from './list-cash-registers.use-case';

const STAFF_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const STAFF_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const mockCashRegisterRepo = {
  findById: jest.fn(),
  findOpenByStaff: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
};

const mockStaffRepo = {
  findByIds: jest.fn(),
};

function buildRegister(overrides: {
  id: string;
  staffId: string;
  status?: CashRegisterStatus;
}): CashRegister {
  const openedAt = new Date('2026-01-01T10:00:00Z');
  return CashRegister.reconstitute({
    id: overrides.id,
    staffId: overrides.staffId,
    openedAt,
    closedAt: null,
    initialAmount: 10000,
    closingAmount: null,
    expectedAmount: null,
    difference: null,
    status: overrides.status ?? CashRegisterStatus.OPEN,
    notes: null,
    createdAt: openedAt,
    updatedAt: openedAt,
  });
}

function buildStaff(id: string, name: string): StaffMember {
  return StaffMember.reconstitute({
    id,
    name,
    email: `${name.toLowerCase()}@test.com`,
    password: 'hashed',
    role: StaffRole.ADMIN,
    isActive: true,
    invitedBy: null,
    googleId: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ListCashRegistersUseCase', () => {
  let useCase: ListCashRegistersUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCashRegistersUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: STAFF_MEMBER_REPOSITORY, useValue: mockStaffRepo },
      ],
    }).compile();

    useCase = module.get<ListCashRegistersUseCase>(ListCashRegistersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated registers enriched with staffName', async () => {
    const r1 = buildRegister({
      id: '11111111-1111-1111-1111-111111111111',
      staffId: STAFF_A,
    });
    const r2 = buildRegister({
      id: '22222222-2222-2222-2222-222222222222',
      staffId: STAFF_B,
      status: CashRegisterStatus.CLOSED,
    });
    mockCashRegisterRepo.findAll.mockResolvedValue({
      items: [r1, r2],
      total: 2,
    });
    mockStaffRepo.findByIds.mockResolvedValue([
      buildStaff(STAFF_A, 'Alice'),
      buildStaff(STAFF_B, 'Bob'),
    ]);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result).toBeInstanceOf(PaginatedResponseDto);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toBeInstanceOf(CashRegisterResponseDto);
    expect(result.items[0].id).toBe(r1.id);
    expect(result.items[0].staffName).toBe('Alice');
    expect(result.items[1].staffName).toBe('Bob');
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should default page=1 and limit=20 when not provided', async () => {
    mockCashRegisterRepo.findAll.mockResolvedValue({ items: [], total: 0 });
    mockStaffRepo.findByIds.mockResolvedValue([]);

    const result = await useCase.execute({});

    const callArg = mockCashRegisterRepo.findAll.mock.calls[0][0] as {
      page: number;
      limit: number;
    };
    expect(callArg.page).toBe(1);
    expect(callArg.limit).toBe(20);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should pass staffId, status, dateFrom, dateTo to the repository', async () => {
    mockCashRegisterRepo.findAll.mockResolvedValue({ items: [], total: 0 });
    mockStaffRepo.findByIds.mockResolvedValue([]);

    await useCase.execute({
      page: 2,
      limit: 10,
      staffId: STAFF_A,
      status: CashRegisterStatus.CLOSED,
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    expect(mockCashRegisterRepo.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      staffId: STAFF_A,
      status: CashRegisterStatus.CLOSED,
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
  });

  it('should return empty paginated response when no items', async () => {
    mockCashRegisterRepo.findAll.mockResolvedValue({ items: [], total: 0 });
    mockStaffRepo.findByIds.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(mockStaffRepo.findByIds).toHaveBeenCalledWith([]);
  });

  it('should deduplicate staffIds before calling findByIds', async () => {
    const r1 = buildRegister({
      id: '11111111-1111-1111-1111-111111111111',
      staffId: STAFF_A,
    });
    const r2 = buildRegister({
      id: '22222222-2222-2222-2222-222222222222',
      staffId: STAFF_A,
    });
    const r3 = buildRegister({
      id: '33333333-3333-3333-3333-333333333333',
      staffId: STAFF_B,
    });
    mockCashRegisterRepo.findAll.mockResolvedValue({
      items: [r1, r2, r3],
      total: 3,
    });
    mockStaffRepo.findByIds.mockResolvedValue([
      buildStaff(STAFF_A, 'Alice'),
      buildStaff(STAFF_B, 'Bob'),
    ]);

    await useCase.execute({ page: 1, limit: 20 });

    const ids = mockStaffRepo.findByIds.mock.calls[0][0] as string[];
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining([STAFF_A, STAFF_B]));
  });

  it('should return staffName=null when a staff lookup is missing', async () => {
    const r1 = buildRegister({
      id: '11111111-1111-1111-1111-111111111111',
      staffId: STAFF_A,
    });
    mockCashRegisterRepo.findAll.mockResolvedValue({
      items: [r1],
      total: 1,
    });
    mockStaffRepo.findByIds.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items[0].staffName).toBeNull();
  });

  it('should compute totalPages correctly', async () => {
    mockCashRegisterRepo.findAll.mockResolvedValue({
      items: [],
      total: 47,
    });
    mockStaffRepo.findByIds.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.totalPages).toBe(3);
  });
});
