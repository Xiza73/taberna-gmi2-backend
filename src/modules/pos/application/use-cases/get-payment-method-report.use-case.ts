import { Inject, Injectable } from '@nestjs/common';

import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import { type PaymentMethodReportQueryDto } from '../dtos/payment-method-report-query.dto';
import { PaymentMethodReportResponseDto } from '../dtos/payment-method-report-response.dto';

@Injectable()
export class GetPaymentMethodReportUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    dto: PaymentMethodReportQueryDto,
  ): Promise<PaymentMethodReportResponseDto> {
    if (dto.dateFrom > dto.dateTo) {
      throw new DomainException(ErrorMessages.POS_REPORTS_INVALID_DATE_RANGE);
    }
    const from = new Date(`${dto.dateFrom}T00:00:00`);
    const to = new Date(`${dto.dateTo}T23:59:59.999`);
    const items = await this.orderRepository.getPosSalesByPaymentMethod(
      from,
      to,
    );
    return new PaymentMethodReportResponseDto({
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      items,
    });
  }
}
