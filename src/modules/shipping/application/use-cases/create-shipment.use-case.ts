import { Inject, Injectable } from '@nestjs/common';

import { DomainConflictException, DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { ORDER_REPOSITORY, type IOrderRepository } from '@modules/orders/domain/interfaces/order-repository.interface.js';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum.js';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity.js';

import { Shipment } from '../../domain/entities/shipment.entity.js';
import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';
import { SHIPMENT_REPOSITORY, type IShipmentRepository } from '../../domain/interfaces/shipment-repository.interface.js';
import { TRACKING_URL_GENERATOR, type TrackingUrlGenerator } from '../../domain/services/tracking-url-generator.js';
import { type CreateShipmentDto } from '../dtos/create-shipment.dto.js';
import { ShipmentResponseDto } from '../dtos/shipment-response.dto.js';

@Injectable()
export class CreateShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipmentRepository: IShipmentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(TRACKING_URL_GENERATOR) private readonly trackingUrlGenerator: TrackingUrlGenerator,
  ) {}

  async execute(orderId: string, dto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }

    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PROCESSING) {
      throw new DomainException(ErrorMessages.ORDER_INVALID_TRANSITION);
    }

    const existing = await this.shipmentRepository.findByOrderId(orderId);
    if (existing) {
      throw new DomainConflictException(ErrorMessages.SHIPMENT_ALREADY_EXISTS);
    }

    const trackingUrl = dto.trackingUrl ?? this.trackingUrlGenerator.generate(dto.carrier, dto.trackingNumber);

    const shipment = Shipment.create({
      orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl,
      status: ShipmentStatus.SHIPPED,
      notes: dto.notes,
    });

    const saved = await this.shipmentRepository.save(shipment);

    // Transition order to shipped
    order.transitionTo(OrderStatus.SHIPPED);
    await this.orderRepository.save(order);

    const event = OrderEvent.create({
      orderId,
      status: OrderStatus.SHIPPED,
      description: 'Envio registrado',
      metadata: { carrier: dto.carrier, trackingNumber: dto.trackingNumber },
    });
    await this.orderRepository.saveEvent(event);

    return new ShipmentResponseDto(saved);
  }
}
