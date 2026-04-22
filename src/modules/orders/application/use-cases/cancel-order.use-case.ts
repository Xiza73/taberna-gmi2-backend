import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainForbiddenException,
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

import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderEvent } from '../../domain/entities/order-event.entity';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(userId: string, orderId: string): Promise<void> {
    await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const orderRepo = this.orderRepository.withTransaction(ctx);
      const couponRepo = this.couponRepository.withTransaction(ctx);

      // 1. Verify ownership
      const order = await orderRepo.findById(orderId);
      if (!order) {
        throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
      }
      if (order.userId !== userId) {
        throw new DomainForbiddenException(ErrorMessages.ORDER_NOT_FOUND);
      }

      // 2. Atomic status transition
      const transitioned = await orderRepo.atomicStatusTransition(
        orderId,
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
      );
      if (!transitioned) {
        throw new DomainException(ErrorMessages.ORDER_CANNOT_CANCEL);
      }

      // 3. Restore stock (ordered by productId ASC)
      const items = await orderRepo.findItemsByOrderId(orderId);
      const sortedItems = [...items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );
      for (const item of sortedItems) {
        await orderRepo.atomicStockRestore(item.productId, item.quantity);
      }

      // 4. Decrement coupon uses
      if (order.couponId) {
        await couponRepo.decrementUses(order.couponId);
      }

      // 5. Create order event
      const event = OrderEvent.create({
        orderId,
        status: OrderStatus.CANCELLED,
        description: 'Orden cancelada por el cliente',
      });
      await orderRepo.saveEvent(event);
    });
  }
}
