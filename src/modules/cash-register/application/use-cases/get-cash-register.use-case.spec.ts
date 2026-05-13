import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

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

const mockOrderRepo = {
  sumCashSalesByStaffBetween: jest.fn(),
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

function buildMovement(
  type: CashMovementType = CashMovementType.CASH_IN,
  amount = 5000,
  id = 'mv-1',
): CashMovement {
  return CashMovement.reconstitute({
    id,
    cashRegisterId: REGISTER_ID,
    staffId: 'staff-1',
    type,
    amount,
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
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetCashRegisterUseCase>(GetCashRegisterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the cash register with its movements and breakdown', async () => {
    const closed = buildClosedRegister();
    mockCashRegisterRepo.findById.mockResolvedValue(closed);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([
      buildMovement(CashMovementType.CASH_IN, 5000, 'mv-1'),
      buildMovement(CashMovementType.CASH_OUT, 1500, 'mv-2'),
    ]);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(50000);

    const result = await useCase.execute(REGISTER_ID);

    expect(mockCashRegisterRepo.findById).toHaveBeenCalledWith(REGISTER_ID);
    expect(mockCashMovementRepo.findByCashRegister).toHaveBeenCalledWith(
      REGISTER_ID,
    );
    expect(mockOrderRepo.sumCashSalesByStaffBetween).toHaveBeenCalledWith(
      'staff-1',
      closed.openedAt,
      closed.closedAt,
    );
    expect(result.id).toBe(REGISTER_ID);
    expect(result.movements).toHaveLength(2);
    expect(result.cashSalesAmount).toBe(50000);
    expect(result.cashInAmount).toBe(5000);
    expect(result.cashOutAmount).toBe(1500);
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
    expect(mockOrderRepo.sumCashSalesByStaffBetween).not.toHaveBeenCalled();
  });
});
