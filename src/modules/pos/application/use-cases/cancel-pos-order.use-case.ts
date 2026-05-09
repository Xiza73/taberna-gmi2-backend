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

import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '@modules/coupons/domain/interfaces/coupon-repository.interface';

import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import { type CancelPosOrderDto } from '../dtos/cancel-pos-order.dto';

interface CurrentStaff {
  id: string;
  name: string;
}

@Injectable()
export class CancelPosOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    staff: CurrentStaff,
    orderId: string,
    dto: CancelPosOrderDto,
  ): Promise<void> {
    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);
      const couponRepo = this.couponRepository.withTransaction(ctx);

      // 1. Validar que la orden existe y es POS/WhatsApp (no online)
      const order = await orderRepo.findById(orderId);
      if (!order) {
        throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
      }
      if (order.channel === OrderChannel.ONLINE) {
        throw new DomainException(ErrorMessages.POS_ORDER_NOT_POS);
      }

      // 2. Atomic transition PAID → CANCELLED. Solo se anulan ordenes pagadas
      //    POS (las pendientes manuales no deberían existir con el flow actual,
      //    pero si hay alguna MercadoPago pendiente se descarta por el filtro
      //    de status acá).
      const transitioned = await orderRepo.atomicStatusTransition(
        orderId,
        OrderStatus.PAID,
        OrderStatus.CANCELLED,
      );
      if (!transitioned) {
        throw new DomainException(ErrorMessages.POS_ORDER_CANNOT_CANCEL);
      }

      // 3. Restaurar stock (sorted by productId — deadlock prevention)
      const items = await orderRepo.findItemsByOrderId(orderId);
      const sorted = [...items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );
      for (const item of sorted) {
        await orderRepo.atomicStockRestore(item.productId, item.quantity);
      }

      // 4. Decrementar uses del cupón si lo tenía
      if (order.couponId) {
        await couponRepo.decrementUses(order.couponId);
      }

      // 5. Order event con motivo + staff
      const event = OrderEvent.create({
        orderId,
        status: OrderStatus.CANCELLED,
        description: `Venta anulada por ${staff.name}: ${dto.reason}`,
        performedBy: staff.id,
      });
      await orderRepo.saveEvent(event);
    });
  }
}
