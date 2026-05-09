import { Test, TestingModule } from '@nestjs/testing';

import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { GetPaymentMethodReportUseCase } from './get-payment-method-report.use-case';

const mockOrderRepo = {
  getPosSalesByPaymentMethod: jest.fn(),
};

describe('GetPaymentMethodReportUseCase', () => {
  let useCase: GetPaymentMethodReportUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentMethodReportUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetPaymentMethodReportUseCase>(
      GetPaymentMethodReportUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call repo with start and end of day for the range and return mapped DTO', async () => {
    mockOrderRepo.getPosSalesByPaymentMethod.mockResolvedValue([
      { paymentMethod: 'cash', count: 10, totalAmount: 200000 },
      { paymentMethod: 'yape_plin', count: 5, totalAmount: 150000 },
    ]);

    const result = await useCase.execute({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-08',
    });

    expect(mockOrderRepo.getPosSalesByPaymentMethod).toHaveBeenCalledTimes(1);
    const [from, to] = mockOrderRepo.getPosSalesByPaymentMethod.mock
      .calls[0] as [Date, Date];
    expect(from).toEqual(new Date('2026-05-01T00:00:00'));
    expect(to).toEqual(new Date('2026-05-08T23:59:59.999'));

    expect(result.dateFrom).toBe('2026-05-01');
    expect(result.dateTo).toBe('2026-05-08');
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      paymentMethod: 'cash',
      count: 10,
      totalAmount: 200000,
    });
  });

  it('should accept equal dateFrom and dateTo (same day)', async () => {
    mockOrderRepo.getPosSalesByPaymentMethod.mockResolvedValue([]);

    await expect(
      useCase.execute({ dateFrom: '2026-05-08', dateTo: '2026-05-08' }),
    ).resolves.toBeDefined();
    expect(mockOrderRepo.getPosSalesByPaymentMethod).toHaveBeenCalled();
  });

  it('should throw POS_REPORTS_INVALID_DATE_RANGE when dateFrom > dateTo', async () => {
    await expect(
      useCase.execute({ dateFrom: '2026-05-09', dateTo: '2026-05-08' }),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute({ dateFrom: '2026-05-09', dateTo: '2026-05-08' }),
    ).rejects.toThrow(ErrorMessages.POS_REPORTS_INVALID_DATE_RANGE);
    expect(mockOrderRepo.getPosSalesByPaymentMethod).not.toHaveBeenCalled();
  });

  it('should return empty items when no sales exist', async () => {
    mockOrderRepo.getPosSalesByPaymentMethod.mockResolvedValue([]);

    const result = await useCase.execute({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-08',
    });

    expect(result.items).toEqual([]);
  });
});
