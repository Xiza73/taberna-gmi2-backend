import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Order } from '../../domain/entities/order.entity';
import { type OrderItem } from '../../domain/entities/order-item.entity';
import { type OrderEvent } from '../../domain/entities/order-event.entity';
import { type OrderStatus } from '../../domain/enums/order-status.enum';
import { type IOrderRepository } from '../../domain/interfaces/order-repository.interface';
import { OrderOrmEntity } from '../orm-entities/order.orm-entity';
import { OrderItemOrmEntity } from '../orm-entities/order-item.orm-entity';
import { OrderEventOrmEntity } from '../orm-entities/order-event.orm-entity';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderItemMapper } from '../mappers/order-item.mapper';
import { OrderEventMapper } from '../mappers/order-event.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orderRepo: Repository<OrderOrmEntity>,
    @InjectRepository(OrderItemOrmEntity)
    private readonly itemRepo: Repository<OrderItemOrmEntity>,
    @InjectRepository(OrderEventOrmEntity)
    private readonly eventRepo: Repository<OrderEventOrmEntity>,
  ) {}

  async save(entity: Order): Promise<Order> {
    const orm = OrderMapper.toOrm(entity);
    const saved = await this.orderRepo.save(orm);
    return OrderMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Order | null> {
    const orm = await this.orderRepo.findOne({ where: { id } });
    return orm ? OrderMapper.toDomain(orm) : null;
  }

  async findByIdWithDetails(id: string): Promise<{
    order: Order;
    items: OrderItem[];
    events: OrderEvent[];
  } | null> {
    const orm = await this.orderRepo.findOne({ where: { id } });
    if (!orm) return null;

    const [itemOrms, eventOrms] = await Promise.all([
      this.itemRepo.find({
        where: { orderId: id },
        order: { createdAt: 'ASC' },
      }),
      this.eventRepo.find({
        where: { orderId: id },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return {
      order: OrderMapper.toDomain(orm),
      items: itemOrms.map((orm) => OrderItemMapper.toDomain(orm)),
      events: eventOrms.map((orm) => OrderEventMapper.toDomain(orm)),
    };
  }

  async findAllByUserId(params: {
    userId: string;
    page: number;
    limit: number;
    status?: OrderStatus;
  }): Promise<{ items: Order[]; total: number }> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.user_id = :userId', { userId: params.userId });

    if (params.status) {
      qb.andWhere('o.status = :status', { status: params.status });
    }

    qb.orderBy('o.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => OrderMapper.toDomain(orm)), total };
  }

  async findAll(params: {
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
  }): Promise<{ items: Order[]; total: number }> {
    const qb = this.orderRepo.createQueryBuilder('o');

    if (params.status) {
      qb.andWhere('o.status = :status', { status: params.status });
    }
    if (params.userId) {
      qb.andWhere('o.user_id = :userId', { userId: params.userId });
    }
    if (params.channel) {
      qb.andWhere('o.channel = :channel', { channel: params.channel });
    }
    if (params.channelIn && params.channelIn.length > 0) {
      qb.andWhere('o.channel IN (:...channelIn)', {
        channelIn: params.channelIn,
      });
    }
    if (params.paymentMethod) {
      qb.andWhere('o.payment_method = :paymentMethod', {
        paymentMethod: params.paymentMethod,
      });
    }
    if (params.staffId) {
      qb.andWhere('o.staff_id = :staffId', { staffId: params.staffId });
    }
    if (params.dateFrom) {
      qb.andWhere('o.created_at >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('o.created_at <= :dateTo', { dateTo: params.dateTo });
    }
    if (params.search) {
      qb.andWhere('o.order_number ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    switch (params.sortBy) {
      case 'total':
        qb.orderBy('o.total', 'DESC');
        break;
      case 'oldest':
        qb.orderBy('o.created_at', 'ASC');
        break;
      default:
        qb.orderBy('o.created_at', 'DESC');
        break;
    }

    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => OrderMapper.toDomain(orm)), total };
  }

  async saveItem(item: OrderItem): Promise<OrderItem> {
    const orm = OrderItemMapper.toOrm(item);
    const saved = await this.itemRepo.save(orm);
    return OrderItemMapper.toDomain(saved);
  }

  async saveEvent(event: OrderEvent): Promise<OrderEvent> {
    const orm = OrderEventMapper.toOrm(event);
    const saved = await this.eventRepo.save(orm);
    return OrderEventMapper.toDomain(saved);
  }

  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const orms = await this.itemRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => OrderItemMapper.toDomain(orm));
  }

  async findEventsByOrderId(orderId: string): Promise<OrderEvent[]> {
    const orms = await this.eventRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => OrderEventMapper.toDomain(orm));
  }

  async atomicStatusTransition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
  ): Promise<boolean> {
    const result = await this.orderRepo
      .createQueryBuilder()
      .update(OrderOrmEntity)
      .set({ status: toStatus, updatedAt: new Date() })
      .where('id = :orderId', { orderId })
      .andWhere('status = :fromStatus', { fromStatus })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async atomicStockDecrement(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const result: [unknown[], number] = await this.orderRepo.manager.query(
      `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
      [quantity, productId],
    );
    return (result[1] ?? 0) > 0;
  }

  async atomicStockRestore(productId: string, quantity: number): Promise<void> {
    await this.orderRepo.manager.query(
      `UPDATE products SET stock = stock + $1 WHERE id = $2`,
      [quantity, productId],
    );
  }

  async findPendingExpired(
    thresholdDate: Date,
    limit: number,
  ): Promise<Order[]> {
    const orms = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'pending' })
      .andWhere('o.created_at < :threshold', { threshold: thresholdDate })
      .orderBy('o.created_at', 'ASC')
      .take(limit)
      .getMany();
    return orms.map((orm) => OrderMapper.toDomain(orm));
  }

  async countUserOrdersWithCoupon(
    userId: string,
    couponId: string,
  ): Promise<number> {
    return this.orderRepo
      .createQueryBuilder('o')
      .where('o.user_id = :userId', { userId })
      .andWhere('o.coupon_id = :couponId', { couponId })
      .andWhere('o.status != :cancelled', { cancelled: 'cancelled' })
      .getCount();
  }

  async sumCashSalesByStaffBetween(
    staffId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'sum')
      .where('o.staff_id = :staffId', { staffId })
      .andWhere('o.payment_method = :pm', { pm: 'cash' })
      .andWhere('o.channel != :online', { online: 'online' })
      .andWhere('o.status IN (:...statuses)', {
        statuses: ['paid', 'processing', 'shipped', 'delivered'],
      })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .getRawOne<{ sum: string }>();
    return Number(result?.sum ?? 0);
  }

  async getPosDailySummary(
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
  }> {
    const moneyStatuses = ['paid', 'processing', 'shipped', 'delivered'];

    const totalsPromise = this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total), 0)', 'sum')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status IN (:...statuses)', { statuses: moneyStatuses })
      .getRawOne<{ count: string; sum: string }>();

    const byPaymentMethodPromise = this.orderRepo
      .createQueryBuilder('o')
      .select('o.payment_method', 'paymentMethod')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total), 0)', 'total')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status IN (:...statuses)', { statuses: moneyStatuses })
      .groupBy('o.payment_method')
      .getRawMany<{ paymentMethod: string; count: string; total: string }>();

    const byStatusPromise = this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .groupBy('o.status')
      .getRawMany<{ status: string; count: string }>();

    const topProductsPromise = this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('order_items', 'oi', 'oi.order_id = o.id')
      .select('oi.product_id', 'productId')
      .addSelect('oi.product_name', 'productName')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'quantity')
      .addSelect('COALESCE(SUM(oi.subtotal), 0)', 'total')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status IN (:...statuses)', { statuses: moneyStatuses })
      .groupBy('oi.product_id')
      .addGroupBy('oi.product_name')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .addOrderBy('SUM(oi.subtotal)', 'DESC')
      .limit(10)
      .getRawMany<{
        productId: string;
        productName: string;
        quantity: string;
        total: string;
      }>();

    const [totals, byPaymentMethodRows, byStatusRows, topProductsRows] =
      await Promise.all([
        totalsPromise,
        byPaymentMethodPromise,
        byStatusPromise,
        topProductsPromise,
      ]);

    return {
      totalOrders: Number(totals?.count ?? 0),
      totalSales: Number(totals?.sum ?? 0),
      byPaymentMethod: byPaymentMethodRows.map((r) => ({
        paymentMethod: r.paymentMethod,
        count: Number(r.count),
        total: Number(r.total),
      })),
      byStatus: byStatusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      topProducts: topProductsRows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        quantity: Number(r.quantity),
        total: Number(r.total),
      })),
    };
  }

  async getPosSalesByPaymentMethod(
    from: Date,
    to: Date,
  ): Promise<
    Array<{ paymentMethod: string; count: number; totalAmount: number }>
  > {
    const moneyStatuses = ['paid', 'processing', 'shipped', 'delivered'];

    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.payment_method', 'paymentMethod')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total), 0)', 'totalAmount')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status IN (:...statuses)', { statuses: moneyStatuses })
      .groupBy('o.payment_method')
      .orderBy('SUM(o.total)', 'DESC')
      .getRawMany<{
        paymentMethod: string;
        count: string;
        totalAmount: string;
      }>();

    return rows.map((r) => ({
      paymentMethod: r.paymentMethod,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
    }));
  }

  async getPosSalesByStaff(
    from: Date,
    to: Date,
  ): Promise<
    Array<{
      staffId: string;
      staffName: string;
      count: number;
      totalAmount: number;
    }>
  > {
    const moneyStatuses = ['paid', 'processing', 'shipped', 'delivered'];

    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('staff_members', 'sm', 'sm.id = o.staff_id')
      .select('o.staff_id', 'staffId')
      .addSelect('sm.name', 'staffName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total), 0)', 'totalAmount')
      .where('o.channel != :online', { online: 'online' })
      .andWhere('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status IN (:...statuses)', { statuses: moneyStatuses })
      .groupBy('o.staff_id')
      .addGroupBy('sm.name')
      .orderBy('SUM(o.total)', 'DESC')
      .getRawMany<{
        staffId: string;
        staffName: string;
        count: string;
        totalAmount: string;
      }>();

    return rows.map((r) => ({
      staffId: r.staffId,
      staffName: r.staffName,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
    }));
  }

  async delete(id: string): Promise<void> {
    await this.orderRepo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const clone = new OrderRepository(
      manager.getRepository(OrderOrmEntity),
      manager.getRepository(OrderItemOrmEntity),
      manager.getRepository(OrderEventOrmEntity),
    ) as this;
    return clone;
  }
}
