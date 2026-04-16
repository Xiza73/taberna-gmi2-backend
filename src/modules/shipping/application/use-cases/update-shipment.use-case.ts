import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface.js';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum.js';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity.js';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';
import {
  SHIPMENT_REPOSITORY,
  type IShipmentRepository,
} from '../../domain/interfaces/shipment-repository.interface.js';
import {
  TRACKING_URL_GENERATOR,
  type TrackingUrlGenerator,
} from '../../domain/services/tracking-url-generator.js';
import { type UpdateShipmentDto } from '../dtos/update-shipment.dto.js';
import { ShipmentResponseDto } from '../dtos/shipment-response.dto.js';

@Injectable()
export class UpdateShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(TRACKING_URL_GENERATOR)
    private readonly trackingUrlGenerator: TrackingUrlGenerator,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
  ) {}

  async execute(
    orderId: string,
    dto: UpdateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepository.findByOrderId(orderId);
    if (!shipment) {
      throw new DomainNotFoundException(ErrorMessages.SHIPMENT_NOT_FOUND);
    }

    // Regenerate tracking URL if carrier or trackingNumber changed
    let trackingUrl = dto.trackingUrl;
    if (
      trackingUrl === undefined &&
      (dto.carrier !== undefined || dto.trackingNumber !== undefined)
    ) {
      const carrier = dto.carrier ?? shipment.carrier;
      const trackingNumber = dto.trackingNumber ?? shipment.trackingNumber;
      trackingUrl = this.trackingUrlGenerator.generate(carrier, trackingNumber);
    }

    shipment.update({
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl,
      status: dto.status,
      deliveredAt:
        dto.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
      notes: dto.notes,
    });

    const saved = await this.shipmentRepository.save(shipment);

    // If marked as delivered, atomic order transition
    if (dto.status === ShipmentStatus.DELIVERED) {
      const order = await this.orderRepository.findById(orderId);
      if (order) {
        const transitioned = await this.orderRepository.atomicStatusTransition(
          orderId,
          order.status,
          OrderStatus.DELIVERED,
        );
        if (transitioned) {
          const event = OrderEvent.create({
            orderId,
            status: OrderStatus.DELIVERED,
            description: 'Pedido entregado',
          });
          await this.orderRepository.saveEvent(event);

          const items = await this.orderRepository.findItemsByOrderId(orderId);
          this.emailSender
            .sendOrderDelivered({
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              email: order.customerEmail,
              productNames: items.map((i) => i.productName),
            })
            .catch(() => {});
        }
      }
    }

    return new ShipmentResponseDto(saved);
  }
}
