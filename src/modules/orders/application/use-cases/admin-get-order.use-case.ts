import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class AdminGetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string): Promise<OrderResponseDto> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }
    return new OrderResponseDto(result.order, {
      items: result.items,
      events: result.events,
    });
  }
}
