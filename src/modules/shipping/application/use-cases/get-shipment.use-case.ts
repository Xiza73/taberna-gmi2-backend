import { Inject, Injectable } from '@nestjs/common';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import {
  SHIPMENT_REPOSITORY,
  type IShipmentRepository,
} from '../../domain/interfaces/shipment-repository.interface';
import { ShipmentResponseDto } from '../dtos/shipment-response.dto';

@Injectable()
export class GetShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: string, orderId: string): Promise<ShipmentResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ORDER_NOT_FOUND);
    }

    const shipment = await this.shipmentRepository.findByOrderId(orderId);
    if (!shipment) {
      throw new DomainNotFoundException(ErrorMessages.SHIPMENT_NOT_FOUND);
    }

    return new ShipmentResponseDto(shipment);
  }
}
