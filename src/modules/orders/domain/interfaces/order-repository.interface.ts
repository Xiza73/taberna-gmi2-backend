import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Order } from '../entities/order.entity.js';
import { type OrderItem } from '../entities/order-item.entity.js';
import { type OrderEvent } from '../entities/order-event.entity.js';
import { type OrderStatus } from '../enums/order-status.enum.js';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository extends IBaseRepository<Order> {
  findByIdWithDetails(
    id: string,
  ): Promise<{ order: Order; items: OrderItem[]; events: OrderEvent[] } | null>;
  findAllByUserId(params: {
    userId: string;
    page: number;
    limit: number;
    status?: OrderStatus;
  }): Promise<{ items: Order[]; total: number }>;
  findAll(params: {
    page: number;
    limit: number;
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
  }): Promise<{ items: Order[]; total: number }>;
  saveItem(item: OrderItem): Promise<OrderItem>;
  saveEvent(event: OrderEvent): Promise<OrderEvent>;
  findItemsByOrderId(orderId: string): Promise<OrderItem[]>;
  findEventsByOrderId(orderId: string): Promise<OrderEvent[]>;
  atomicStatusTransition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
  ): Promise<boolean>;
  atomicStockDecrement(productId: string, quantity: number): Promise<boolean>;
  atomicStockRestore(productId: string, quantity: number): Promise<void>;
  findPendingExpired(thresholdDate: Date, limit: number): Promise<Order[]>;
  countUserOrdersWithCoupon(userId: string, couponId: string): Promise<number>;
}
