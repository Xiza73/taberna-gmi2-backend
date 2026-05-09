import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';

import { GetCurrentCashRegisterUseCase } from './get-current-cash-register.use-case';

const mockCashRegisterRepo = {
  findById: jest.fn(),
  findOpenByStaff: jest.fn(),
  save: jest.fn(),
};

function buildOpenRegister(): CashRegister {
  return CashRegister.reconstitute({
    id: '11111111-1111-1111-1111-111111111111',
    staffId: 'staff-1',
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

describe('GetCurrentCashRegisterUseCase', () => {
  let useCase: GetCurrentCashRegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurrentCashRegisterUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
      ],
    }).compile();

    useCase = module.get<GetCurrentCashRegisterUseCase>(
      GetCurrentCashRegisterUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the open cash register for the staff', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());

    const result = await useCase.execute('staff-1');

    expect(mockCashRegisterRepo.findOpenByStaff).toHaveBeenCalledWith('staff-1');
    expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.status).toBe(CashRegisterStatus.OPEN);
    expect(result.movements).toBeUndefined();
  });

  it('should throw NotFound when no open register exists', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(null);

    await expect(useCase.execute('staff-1')).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute('staff-1')).rejects.toThrow(
      ErrorMessages.POS_CASH_REGISTER_NOT_OPEN,
    );
  });
});
