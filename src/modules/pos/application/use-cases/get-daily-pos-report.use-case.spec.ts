import { Test, TestingModule } from '@nestjs/testing';

import { ORDER_REPOSITORY } from '@modules/orders/domain/interfaces/order-repository.interface';

import { GetDailyPosReportUseCase } from './get-daily-pos-report.use-case';

const mockOrderRepo = {
  getPosDailySummary: jest.fn(),
};

function fakeSummary() {
  return {
    totalOrders: 12,
    totalSales: 350000,
    byPaymentMethod: [
      { paymentMethod: 'cash', count: 8, total: 200000 },
      { paymentMethod: 'yape_plin', count: 4, total: 150000 },
    ],
    byStatus: [
      { status: 'paid', count: 10 },
      { status: 'cancelled', count: 1 },
      { status: 'refunded', count: 1 },
    ],
    topProducts: [
      {
        productId: 'p-1',
        productName: 'Cerveza Pilsen',
        quantity: 30,
        total: 90000,
      },
    ],
  };
}

describe('GetDailyPosReportUseCase', () => {
  let useCase: GetDailyPosReportUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyPosReportUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepo },
      ],
    }).compile();

    useCase = module.get<GetDailyPosReportUseCase>(GetDailyPosReportUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call repository with start and end of day for explicit date', async () => {
    mockOrderRepo.getPosDailySummary.mockResolvedValue(fakeSummary());

    const result = await useCase.execute('2026-05-08');

    expect(mockOrderRepo.getPosDailySummary).toHaveBeenCalledTimes(1);
    const [from, to] = mockOrderRepo.getPosDailySummary.mock.calls[0] as [
      Date,
      Date,
    ];
    expect(from).toEqual(new Date('2026-05-08T00:00:00'));
    expect(to).toEqual(new Date('2026-05-08T23:59:59.999'));
    expect(result.date).toBe('2026-05-08');
    expect(result.totalOrders).toBe(12);
    expect(result.totalSales).toBe(350000);
  });

  it('should default to today when date is undefined', async () => {
    mockOrderRepo.getPosDailySummary.mockResolvedValue(fakeSummary());
    const today = new Date().toISOString().slice(0, 10);

    const result = await useCase.execute();

    expect(result.date).toBe(today);
    const [from, to] = mockOrderRepo.getPosDailySummary.mock.calls[0] as [
      Date,
      Date,
    ];
    expect(from).toEqual(new Date(`${today}T00:00:00`));
    expect(to).toEqual(new Date(`${today}T23:59:59.999`));
  });

  it('should return all summary sections including byStatus with cancelled and refunded', async () => {
    mockOrderRepo.getPosDailySummary.mockResolvedValue(fakeSummary());

    const result = await useCase.execute('2026-05-08');

    expect(result.byPaymentMethod).toHaveLength(2);
    expect(result.byStatus).toEqual(
      expect.arrayContaining([
        { status: 'cancelled', count: 1 },
        { status: 'refunded', count: 1 },
      ]),
    );
    expect(result.topProducts).toHaveLength(1);
    expect(result.topProducts[0].productName).toBe('Cerveza Pilsen');
  });

  it('should propagate repository errors', async () => {
    mockOrderRepo.getPosDailySummary.mockRejectedValue(new Error('db down'));
    await expect(useCase.execute('2026-05-08')).rejects.toThrow('db down');
  });
});
