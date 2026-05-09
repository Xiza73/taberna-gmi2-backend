import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

@Injectable()
export class GetPosOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string): Promise<OrderResponseDto> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }
    if (result.order.channel === OrderChannel.ONLINE) {
      throw new DomainException(ErrorMessages.POS_ORDER_NOT_POS);
    }
    return new OrderResponseDto(result.order, {
      items: result.items,
      events: result.events,
      paymentUrl: null,
    });
  }
}
