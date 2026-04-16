import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface.js';
import { type UpdateOrderNotesDto } from '../dtos/update-order-notes.dto.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class UpdateOrderNotesUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    orderId: string,
    dto: UpdateOrderNotesDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    order.updateNotes(dto.adminNotes);
    await this.orderRepository.save(order);

    return new OrderResponseDto(order);
  }
}
