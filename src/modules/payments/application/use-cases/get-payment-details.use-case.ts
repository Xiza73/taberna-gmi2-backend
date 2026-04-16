import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  PAYMENT_REPOSITORY,
  type IPaymentRepository,
} from '../../domain/interfaces/payment-repository.interface.js';
import { PaymentResponseDto } from '../dtos/payment-response.dto.js';

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
