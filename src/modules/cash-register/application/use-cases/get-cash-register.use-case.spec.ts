import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashMovement } from '../../domain/entities/cash-movement.entity';
import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_MOVEMENT_REPOSITORY } from '../../domain/interfaces/cash-movement-repository.interface';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';

import { GetCashRegisterUseCase } from './get-cash-register.use-case';

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

function buildClosedRegister(): CashRegister {
  return CashRegister.reconstitute({
    id: REGISTER_ID,
    staffId: 'staff-1',
    openedAt: new Date('2026-01-01T10:00:00Z'),
    closedAt: new Date('2026-01-01T20:00:00Z'),
    initialAmount: 10000,
    closingAmount: 70000,
    expectedAmount: 70000,
    difference: 0,
    status: CashRegisterStatus.CLOSED,
    notes: 'cierre limpio',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T20:00:00Z'),
  });
}

function buildMovement(): CashMovement {
  return CashMovement.reconstitute({
    id: 'mv-1',
    cashRegisterId: REGISTER_ID,
    staffId: 'staff-1',
    type: CashMovementType.CASH_IN,
    amount: 5000,
    reason: 'aporte',
    createdAt: new Date('2026-01-01T12:00:00Z'),
    updatedAt: new Date('2026-01-01T12:00:00Z'),
  });
}

describe('GetCashRegisterUseCase', () => {
  let useCase: GetCashRegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCashRegisterUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: CASH_MOVEMENT_REPOSITORY, useValue: mockCashMovementRepo },
      ],
    }).compile();

    useCase = module.get<GetCashRegisterUseCase>(GetCashRegisterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the cash register with its movements', async () => {
    mockCashRegisterRepo.findById.mockResolvedValue(buildClosedRegister());
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([buildMovement()]);

    const result = await useCase.execute(REGISTER_ID);

    expect(mockCashRegisterRepo.findById).toHaveBeenCalledWith(REGISTER_ID);
    expect(mockCashMovementRepo.findByCashRegister).toHaveBeenCalledWith(
      REGISTER_ID,
    );
    expect(result.id).toBe(REGISTER_ID);
    expect(result.movements).toHaveLength(1);
    expect(result.movements?.[0].id).toBe('mv-1');
  });

  it('should throw NotFound when the cash register does not exist', async () => {
    mockCashRegisterRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(REGISTER_ID)).rejects.toThrow(
      DomainNotFoundException,
    );
    await expect(useCase.execute(REGISTER_ID)).rejects.toThrow(
      ErrorMessages.POS_CASH_REGISTER_NOT_FOUND,
    );
    expect(mockCashMovementRepo.findByCashRegister).not.toHaveBeenCalled();
  });
});
