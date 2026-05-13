import { Test, TestingModule } from '@nestjs/testing';

import { DomainConflictException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';

import { OpenCashRegisterUseCase } from './open-cash-register.use-case';

const mockCashRegisterRepo = {
  findById: jest.fn(),
  findOpenByStaff: jest.fn(),
  save: jest.fn(),
};

function buildOpenRegister(overrides: { id?: string; staffId?: string } = {}) {
  return CashRegister.reconstitute({
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    staffId: overrides.staffId ?? 'staff-1',
    openedAt: new Date('2026-01-01T10:00:00Z'),
    closedAt: null,
    initialAmount: 10000,
    closingAmount: null,
    expectedAmount: null,
    difference: null,
    status: CashRegisterStatus.OPEN,
    notes: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  });
}

describe('OpenCashRegisterUseCase', () => {
  let useCase: OpenCashRegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenCashRegisterUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
      ],
    }).compile();

    useCase = module.get<OpenCashRegisterUseCase>(OpenCashRegisterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open a cash register when none is open for the staff', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(null);
    mockCashRegisterRepo.save.mockImplementation(
      async (entity: CashRegister) => entity,
    );

    const result = await useCase.execute('staff-1', { initialAmount: 50000 });

    expect(mockCashRegisterRepo.findOpenByStaff).toHaveBeenCalledWith('staff-1');
    expect(mockCashRegisterRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = mockCashRegisterRepo.save.mock.calls[0][0] as CashRegister;
    expect(savedArg.staffId).toBe('staff-1');
    expect(savedArg.initialAmount).toBe(50000);
    expect(savedArg.status).toBe(CashRegisterStatus.OPEN);
    expect(result.staffId).toBe('staff-1');
    expect(result.initialAmount).toBe(50000);
    expect(result.status).toBe(CashRegisterStatus.OPEN);
    expect(result.closedAt).toBeNull();
    expect(result.cashSalesAmount).toBe(0);
    expect(result.cashInAmount).toBe(0);
    expect(result.cashOutAmount).toBe(0);
  });

  it('should throw DomainConflictException when staff already has an open register', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());

    await expect(
      useCase.execute('staff-1', { initialAmount: 50000 }),
    ).rejects.toThrow(DomainConflictException);
    await expect(
      useCase.execute('staff-1', { initialAmount: 50000 }),
    ).rejects.toThrow(ErrorMessages.POS_CASH_REGISTER_ALREADY_OPEN);
    expect(mockCashRegisterRepo.save).not.toHaveBeenCalled();
  });
});
