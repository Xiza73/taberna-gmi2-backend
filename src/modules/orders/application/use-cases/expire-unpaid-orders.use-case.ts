import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
export class ExpireUnpaidOrdersUseCase {
  private readonly logger = new Logger(ExpireUnpaidOrdersUseCase.name);
  private readonly batchSize = 50;
  private readonly maxTotal = 500;

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<number> {
    const hours = this.configService.get<number>('ORDER_EXPIRATION_HOURS', 2);
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    let totalExpired = 0;
    let batchCount: number;

    do {
      const orders = await this.orderRepository.findPendingExpired(
        threshold,
        this.batchSize,
      );
      batchCount = orders.length;

      for (const order of orders) {
        try {
          await this.unitOfWork.execute(async (ctx: TransactionContext) => {
            const orderRepo = this.orderRepository.withTransaction(ctx);
            const couponRepo = this.couponRepository.withTransaction(ctx);

            // 1. Atomic status transition
            const transitioned = await orderRepo.atomicStatusTransition(
              order.id,
              OrderStatus.PENDING,
              OrderStatus.CANCELLED,
            );

            if (!transitioned) return;

            // 2. Restore stock (ordered by productId ASC)
            const items = await orderRepo.findItemsByOrderId(order.id);
            const sortedItems = [...items].sort((a, b) =>
              a.productId.localeCompare(b.productId),
            );
            for (const item of sortedItems) {
              await orderRepo.atomicStockRestore(item.productId, item.quantity);
            }

            // 3. Decrement coupon uses
            if (order.couponId) {
              await couponRepo.decrementUses(order.couponId);
            }

            // 4. Create order event
            const event = OrderEvent.create({
              orderId: order.id,
              status: OrderStatus.CANCELLED,
              description: 'Orden expirada por falta de pago',
            });
            await orderRepo.saveEvent(event);

            totalExpired++;
          });
        } catch (error) {
          this.logger.error(`Failed to expire order ${order.id}`, error);
        }
      }
    } while (batchCount >= this.batchSize && totalExpired < this.maxTotal);

    return totalExpired;
  }
}
