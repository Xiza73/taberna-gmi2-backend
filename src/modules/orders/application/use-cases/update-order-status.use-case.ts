import { Inject, Injectable } from '@nestjs/common';

import { DomainConflictException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { OrderEvent } from '../../domain/entities/order-event.entity.js';
import { ORDER_REPOSITORY, type IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';
import { type UpdateOrderStatusDto } from '../dtos/update-order-status.dto.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string, adminId: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    const previousStatus = order.status;
    order.transitionTo(dto.status);

    const transitioned = await this.orderRepository.atomicStatusTransition(orderId, previousStatus, dto.status);
    if (!transitioned) {
      throw new DomainConflictException(ErrorMessages.ORDER_STATUS_CONFLICT);
    }

    const event = OrderEvent.create({
      orderId,
      status: dto.status,
      description: `Estado cambiado a ${dto.status}`,
      performedBy: adminId,
    });
    await this.orderRepository.saveEvent(event);

    const result = await this.orderRepository.findByIdWithDetails(orderId);
    return new OrderResponseDto(result!.order, {
      items: result!.items,
      events: result!.events,
    });
  }
}
