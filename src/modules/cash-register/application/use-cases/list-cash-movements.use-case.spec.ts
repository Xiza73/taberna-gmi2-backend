import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashMovement } from '../../domain/entities/cash-movement.entity';
import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_MOVEMENT_REPOSITORY } from '../../domain/interfaces/cash-movement-repository.interface';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';

import { ListCashMovementsUseCase } from './list-cash-movements.use-case';

const REGISTER_ID = '11111111-1111-1111-1111-111111111111';

const mockCashRegisterRepo = {
  findById: jest.fn(),
  findOpenByStaff: jest.fn(),
  save: jest.fn(),
};

const mockCashMovementRepo = {
  findByCashRegister: jest.fn(),
  save: jest.fn(),
};

function buildOpenRegister(): CashRegister {
  return CashRegister.reconstitute({
    id: REGISTER_ID,
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

function buildMovement(id: string, type: CashMovementType): CashMovement {
  return CashMovement.reconstitute({
    id,
    cashRegisterId: REGISTER_ID,
    staffId: 'staff-1',
    type,
    amount: 1000,
    reason: 'test',
    createdAt: new Date('2026-01-01T11:00:00Z'),
    updatedAt: new Date('2026-01-01T11:00:00Z'),
  });
}

describe('ListCashMovementsUseCase', () => {
  let useCase: ListCashMovementsUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCashMovementsUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: CASH_MOVEMENT_REPOSITORY, useValue: mockCashMovementRepo },
      ],
    }).compile();

    useCase = module.get<ListCashMovementsUseCase>(ListCashMovementsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return movements for the current open register', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([
      buildMovement('mv-1', CashMovementType.CASH_IN),
      buildMovement('mv-2', CashMovementType.CASH_OUT),
    ]);

    const result = await useCase.execute('staff-1');

    expect(mockCashRegisterRepo.findOpenByStaff).toHaveBeenCalledWith('staff-1');
    expect(mockCashMovementRepo.findByCashRegister).toHaveBeenCalledWith(
      REGISTER_ID,
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('mv-1');
    expect(result[1].id).toBe('mv-2');
  });

  it('should return empty array when no movements exist', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([]);

    const result = await useCase.execute('staff-1');

    expect(result).toEqual([]);
  });

  it('should throw NotFound when no open register exists', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(null);

    await expect(useCase.execute('staff-1')).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute('staff-1')).rejects.toThrow(
      ErrorMessages.POS_CASH_REGISTER_NOT_OPEN,
    );
    expect(mockCashMovementRepo.findByCashRegister).not.toHaveBeenCalled();
  });
});
