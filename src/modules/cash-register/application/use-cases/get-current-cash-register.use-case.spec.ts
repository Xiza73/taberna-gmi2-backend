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

import { GetCurrentCashRegisterUseCase } from './get-current-cash-register.use-case';

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

function buildMovement(
  type: CashMovementType,
  amount: number,
  id: string,
): CashMovement {
  return CashMovement.reconstitute({
    id,
    cashRegisterId: REGISTER_ID,
    staffId: 'staff-1',
    type,
    amount,
    reason: 'test',
    createdAt: new Date('2026-01-01T11:00:00Z'),
    updatedAt: new Date('2026-01-01T11:00:00Z'),
  });
}

describe('GetCurrentCashRegisterUseCase', () => {
  let useCase: GetCurrentCashRegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurrentCashRegisterUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: CASH_MOVEMENT_REPOSITORY, useValue: mockCashMovementRepo },
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetCurrentCashRegisterUseCase>(
      GetCurrentCashRegisterUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the open cash register for the staff with breakdown', async () => {
    const register = buildOpenRegister();
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(register);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([
      buildMovement(CashMovementType.CASH_IN, 3000, 'mv-1'),
      buildMovement(CashMovementType.CASH_OUT, 800, 'mv-2'),
    ]);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(25000);

    const result = await useCase.execute('staff-1');

    expect(mockCashRegisterRepo.findOpenByStaff).toHaveBeenCalledWith('staff-1');
    expect(mockCashMovementRepo.findByCashRegister).toHaveBeenCalledWith(
      REGISTER_ID,
    );
    expect(mockOrderRepo.sumCashSalesByStaffBetween).toHaveBeenCalledWith(
      'staff-1',
      register.openedAt,
      expect.any(Date),
    );
    expect(result.id).toBe(REGISTER_ID);
    expect(result.status).toBe(CashRegisterStatus.OPEN);
    expect(result.movements).toBeUndefined();
    expect(result.cashSalesAmount).toBe(25000);
    expect(result.cashInAmount).toBe(3000);
    expect(result.cashOutAmount).toBe(800);
  });

  it('should return zero breakdown when there are no sales or movements', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([]);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(0);

    const result = await useCase.execute('staff-1');

    expect(result.cashSalesAmount).toBe(0);
    expect(result.cashInAmount).toBe(0);
    expect(result.cashOutAmount).toBe(0);
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
    expect(mockOrderRepo.sumCashSalesByStaffBetween).not.toHaveBeenCalled();
  });
});
