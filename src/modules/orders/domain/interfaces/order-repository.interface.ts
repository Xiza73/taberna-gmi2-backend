import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Order } from '../entities/order.entity';
import { type OrderItem } from '../entities/order-item.entity';
import { type OrderEvent } from '../entities/order-event.entity';
import { type OrderStatus } from '../enums/order-status.enum';

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
    channel?: string;
    channelIn?: string[];
    paymentMethod?: string;
    staffId?: string;
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
  sumCashSalesByStaffBetween(
    staffId: string,
    from: Date,
    to: Date,
  ): Promise<number>;
  getPosDailySummary(
    from: Date,
    to: Date,
  ): Promise<{
    totalOrders: number;
    totalSales: number;
    byPaymentMethod: Array<{
      paymentMethod: string;
      count: number;
      total: number;
    }>;
    byStatus: Array<{ status: string; count: number }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantity: number;
      total: number;
    }>;
  }>;
  getPosSalesByPaymentMethod(
    from: Date,
    to: Date,
  ): Promise<
    Array<{ paymentMethod: string; count: number; totalAmount: number }>
  >;
  getPosSalesByStaff(
    from: Date,
    to: Date,
  ): Promise<
    Array<{
      staffId: string;
      staffName: string;
      count: number;
      totalAmount: number;
    }>
  >;
}
