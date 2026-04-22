import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  PAYMENT_REPOSITORY,
  type IPaymentRepository,
} from '../../domain/interfaces/payment-repository.interface';
import { PaymentResponseDto } from '../dtos/payment-response.dto';

@Injectable()
export class GetPaymentDetailsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(orderId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new DomainNotFoundException(ErrorMessages.PAYMENT_NOT_FOUND);
    }
    return new PaymentResponseDto(payment);
  }
}
