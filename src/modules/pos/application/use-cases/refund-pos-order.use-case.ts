import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
  type TransactionContext,
} from '@shared/domain/interfaces/unit-of-work.interface';

import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import { type RefundPosOrderDto } from '../dtos/refund-pos-order.dto';

interface CurrentStaff {
  id: string;
  name: string;
}

@Injectable()
export class RefundPosOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    staff: CurrentStaff,
    orderId: string,
    dto: RefundPosOrderDto,
  ): Promise<void> {
    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);

      // 1. Validar que la orden existe y es POS/WhatsApp
      const order = await orderRepo.findById(orderId);
      if (!order) {
        throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
      }
      if (order.channel === OrderChannel.ONLINE) {
        throw new DomainException(ErrorMessages.POS_ORDER_NOT_POS);
      }
      if (
        order.status !== OrderStatus.PAID &&
        order.status !== OrderStatus.PROCESSING
      ) {
        throw new DomainException(ErrorMessages.POS_ORDER_CANNOT_REFUND);
      }

      // 2. Cargar items reales de la orden
      const orderItems = await orderRepo.findItemsByOrderId(orderId);
      const itemsById = new Map(orderItems.map((i) => [i.id, i]));

      const isFullRefund = !dto.items || dto.items.length === 0;

      // 3. Determinar qué cantidades restaurar al stock
      const restorePlan: Array<{ productId: string; quantity: number }> = [];
      const refundDetailParts: string[] = [];

      if (isFullRefund) {
        for (const item of orderItems) {
          restorePlan.push({
            productId: item.productId,
            quantity: item.quantity,
          });
          refundDetailParts.push(`${item.quantity}× ${item.productName}`);
        }
      } else {
        for (const reqItem of dto.items!) {
          const orderItem = itemsById.get(reqItem.orderItemId);
          if (!orderItem) {
            throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
          }
          if (reqItem.quantity > orderItem.quantity) {
            throw new DomainException(
              ErrorMessages.POS_REFUND_QUANTITY_EXCEEDED,
            );
          }
          restorePlan.push({
            productId: orderItem.productId,
            quantity: reqItem.quantity,
          });
          refundDetailParts.push(
            `${reqItem.quantity}× ${orderItem.productName}`,
          );
        }
      }

      // 4. Atomic stock restore (sorted by productId — deadlock prevention)
      const sortedRestore = [...restorePlan].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );
      for (const item of sortedRestore) {
        await orderRepo.atomicStockRestore(item.productId, item.quantity);
      }

      // 5. Si es devolución total, transicionar a REFUNDED
      if (isFullRefund) {
        const transitioned = await orderRepo.atomicStatusTransition(
          orderId,
          order.status,
          OrderStatus.REFUNDED,
        );
        if (!transitioned) {
          throw new DomainException(ErrorMessages.ORDER_STATUS_CONFLICT);
        }
      }

      // 6. Order event
      const description = isFullRefund
        ? `Devolución total por ${staff.name}: ${dto.reason}`
        : `Devolución parcial por ${staff.name} (${refundDetailParts.join(', ')}): ${dto.reason}`;
      const event = OrderEvent.create({
        orderId,
        status: isFullRefund ? OrderStatus.REFUNDED : order.status,
        description,
        performedBy: staff.id,
        metadata: {
          refundType: isFullRefund ? 'total' : 'partial',
          items: restorePlan,
        },
      });
      await orderRepo.saveEvent(event);
    });
  }
}
