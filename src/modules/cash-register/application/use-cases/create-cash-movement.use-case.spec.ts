import { Test, TestingModule } from '@nestjs/testing';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashMovement } from '../../domain/entities/cash-movement.entity';
import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { CASH_MOVEMENT_REPOSITORY } from '../../domain/interfaces/cash-movement-repository.interface';
import { CASH_REGISTER_REPOSITORY } from '../../domain/interfaces/cash-register-repository.interface';

import { CreateCashMovementUseCase } from './create-cash-movement.use-case';

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

describe('CreateCashMovementUseCase', () => {
  let useCase: CreateCashMovementUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCashMovementUseCase,
        { provide: CASH_REGISTER_REPOSITORY, useValue: mockCashRegisterRepo },
        { provide: CASH_MOVEMENT_REPOSITORY, useValue: mockCashMovementRepo },
      ],
    }).compile();

    useCase = module.get<CreateCashMovementUseCase>(CreateCashMovementUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a cash_in movement on the open register', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());
    mockCashMovementRepo.save.mockImplementation(
      async (entity: CashMovement) => entity,
    );

    const result = await useCase.execute('staff-1', {
      type: CashMovementType.CASH_IN,
      amount: 1500,
      reason: 'aporte extra',
    });

    expect(mockCashRegisterRepo.findOpenByStaff).toHaveBeenCalledWith('staff-1');
    expect(mockCashMovementRepo.save).toHaveBeenCalledTimes(1);
    const saved = mockCashMovementRepo.save.mock.calls[0][0] as CashMovement;
    expect(saved.cashRegisterId).toBe(REGISTER_ID);
    expect(saved.staffId).toBe('staff-1');
    expect(saved.type).toBe(CashMovementType.CASH_IN);
    expect(saved.amount).toBe(1500);
    expect(saved.reason).toBe('aporte extra');
    expect(result.amount).toBe(1500);
    expect(result.type).toBe(CashMovementType.CASH_IN);
  });

  it('should create a cash_out movement on the open register', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(buildOpenRegister());
    mockCashMovementRepo.save.mockImplementation(
      async (entity: CashMovement) => entity,
    );

    const result = await useCase.execute('staff-1', {
      type: CashMovementType.CASH_OUT,
      amount: 800,
      reason: 'pago proveedor',
    });

    expect(result.type).toBe(CashMovementType.CASH_OUT);
    expect(result.amount).toBe(800);
    expect(result.reason).toBe('pago proveedor');
  });

  it('should throw NotFound when no open register exists', async () => {
    mockCashRegisterRepo.findOpenByStaff.mockResolvedValue(null);

    await expect(
      useCase.execute('staff-1', {
        type: CashMovementType.CASH_IN,
        amount: 100,
        reason: 'x',
      }),
    ).rejects.toThrow(DomainNotFoundException);
    await expect(
      useCase.execute('staff-1', {
        type: CashMovementType.CASH_IN,
        amount: 100,
        reason: 'x',
      }),
    ).rejects.toThrow(ErrorMessages.POS_CASH_REGISTER_NOT_OPEN);
    expect(mockCashMovementRepo.save).not.toHaveBeenCalled();
  });
});
