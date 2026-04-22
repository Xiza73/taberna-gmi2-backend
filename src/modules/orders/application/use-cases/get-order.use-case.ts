import { Inject, Injectable } from '@nestjs/common';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: string, orderId: string): Promise<OrderResponseDto> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (result.order.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ORDER_NOT_FOUND);
    }

    return new OrderResponseDto(result.order, {
      items: result.items,
      events: result.events,
    });
  }
}
