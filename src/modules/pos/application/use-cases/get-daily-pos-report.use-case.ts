import { Inject, Injectable } from '@nestjs/common';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import { DailyPosReportResponseDto } from '../dtos/daily-pos-report-response.dto';

@Injectable()
export class GetDailyPosReportUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(date?: string): Promise<DailyPosReportResponseDto> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const from = new Date(`${targetDate}T00:00:00`);
    const to = new Date(`${targetDate}T23:59:59.999`);
    const summary = await this.orderRepository.getPosDailySummary(from, to);
    return new DailyPosReportResponseDto(targetDate, summary);
  }
}
