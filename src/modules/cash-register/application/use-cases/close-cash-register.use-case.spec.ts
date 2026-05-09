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

import { CloseCashRegisterUseCase } from './close-cash-register.use-case';

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

const REGISTER_ID = '11111111-1111-1111-1111-111111111111';

function buildOpenRegister(initial = 10000): CashRegister {
  return CashRegister.reconstitute({
    id: REGISTER_ID,
    staffId: 'staff-1',
    openedAt: new Date('2026-01-01T10:00:00Z'),
    closedAt: null,
    initialAmount: initial,
    closingAmount: null,
    expectedAmount: null,
    difference: null,
    status: CashRegisterStatus.OPEN,
    notes: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  });
}

function buildMovement(type: CashMovementType, amount: number): CashMovement {
  return CashMovement.reconstitute({
    id: `mv-${type}-${amount}`,
    cashRegisterId: REGISTER_ID,
    staffId: 'staff-1',
    type,
    amount,
    reason: 'test',
    createdAt: new Date('2026-01-01T11:00:00Z'),
    updatedAt: new Date('2026-01-01T11:00:00Z'),
  });
}

describe('CloseCashRegisterUseCase', () => {
  let useCase: CloseCashRegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloseCashRegisterUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: CASH_MOVEMENT_REPOSITORY, useValue: mockCashMovementRepo },
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<CloseCashRegisterUseCase>(CloseCashRegisterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotFound when no open cash register exists', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(null);

    await expect(
      useCase.execute('staff-1', { closingAmount: 10000 }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute('staff-1', { closingAmount: 10000 }),
    ).rejects.toThrow(ErrorMessages.POS_CASH_REGISTER_NOT_OPEN);
    expect(mockOrderRepo.sumCashSalesByStaffBetween).not.toHaveBeenCalled();
    expect(mockCashRegisterRepo.save).not.toHaveBeenCalled();
  });

  it('should compute expected amount and difference correctly with sales and movements', async () => {
    const register = buildOpenRegister(10000);
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(register);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(50000);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([
      buildMovement(CashMovementType.CASH_IN, 5000),
      buildMovement(CashMovementType.CASH_IN, 2500),
      buildMovement(CashMovementType.CASH_OUT, 1500),
    ]);
    mockCashRegisterRepo.save.mockImplementation(
      async (entity: CashRegister) => entity,
    );

    // expected = 10000 + 50000 + (5000+2500) - 1500 = 66000
    const result = await useCase.execute('staff-1', { closingAmount: 65000 });

    expect(mockOrderRepo.sumCashSalesByStaffBetween).toHaveBeenCalledWith(
      'staff-1',
      register.openedAt,
      expect.any(Date),
    );
    expect(mockCashMovementRepo.findByCashRegister).toHaveBeenCalledWith(
      REGISTER_ID,
    );
    expect(result.expectedAmount).toBe(66000);
    expect(result.difference).toBe(-1000);
    expect(result.closingAmount).toBe(65000);
    expect(result.status).toBe(CashRegisterStatus.CLOSED);
    expect(result.closedAt).not.toBeNull();
  });

  it('should compute expected when no sales or movements (only initialAmount)', async () => {
    const register = buildOpenRegister(20000);
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(register);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(0);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([]);
    mockCashRegisterRepo.save.mockImplementation(
      async (entity: CashRegister) => entity,
    );

    const result = await useCase.execute('staff-1', { closingAmount: 20000 });

    expect(result.expectedAmount).toBe(20000);
    expect(result.difference).toBe(0);
  });

  it('should pass notes through when provided', async () => {
    const register = buildOpenRegister(0);
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(register);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(0);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([]);
    mockCashRegisterRepo.save.mockImplementation(
      async (entity: CashRegister) => entity,
    );

    const result = await useCase.execute('staff-1', {
      closingAmount: 0,
      notes: 'cierre limpio',
    });

    expect(result.notes).toBe('cierre limpio');
  });

  it('should produce a positive difference when closingAmount exceeds expected', async () => {
    const register = buildOpenRegister(10000);
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(register);
    mockOrderRepo.sumCashSalesByStaffBetween.mockResolvedValue(0);
    mockCashMovementRepo.findByCashRegister.mockResolvedValue([]);
    mockCashRegisterRepo.save.mockImplementation(
      async (entity: CashRegister) => entity,
    );

    const result = await useCase.execute('staff-1', { closingAmount: 12000 });
    expect(result.expectedAmount).toBe(10000);
    expect(result.difference).toBe(2000);
  });
});
