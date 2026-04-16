import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Order } from '../../domain/entities/order.entity.js';
import { type OrderItem } from '../../domain/entities/order-item.entity.js';
import { type OrderEvent } from '../../domain/entities/order-event.entity.js';
import { type OrderStatus } from '../../domain/enums/order-status.enum.js';
import { type IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';
import { OrderOrmEntity } from '../orm-entities/order.orm-entity.js';
import { OrderItemOrmEntity } from '../orm-entities/order-item.orm-entity.js';
import { OrderEventOrmEntity } from '../orm-entities/order-event.orm-entity.js';
import { OrderMapper } from '../mappers/order.mapper.js';
import { OrderItemMapper } from '../mappers/order-item.mapper.js';
import { OrderEventMapper } from '../mappers/order-event.mapper.js';

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

  async findByIdWithDetails(id: string): Promise<{ order: Order; items: OrderItem[]; events: OrderEvent[] } | null> {
    const orm = await this.orderRepo.findOne({ where: { id } });
    if (!orm) return null;

    const [itemOrms, eventOrms] = await Promise.all([
      this.itemRepo.find({ where: { orderId: id }, order: { createdAt: 'ASC' } }),
      this.eventRepo.find({ where: { orderId: id }, order: { createdAt: 'ASC' } }),
    ]);

    return {
      order: OrderMapper.toDomain(orm),
      items: itemOrms.map(OrderItemMapper.toDomain),
      events: eventOrms.map(OrderEventMapper.toDomain),
    };
  }

  async findAllByUserId(params: {
    userId: string;
    page: number;
    limit: number;
    status?: OrderStatus;
  }): Promise<{ items: Order[]; total: number }> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .where('o.user_id = :userId', { userId: params.userId });

    if (params.status) {
      qb.andWhere('o.status = :status', { status: params.status });
    }

    qb.orderBy('o.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map(OrderMapper.toDomain), total };
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    userId?: string;
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
    if (params.dateFrom) {
      qb.andWhere('o.created_at >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('o.created_at <= :dateTo', { dateTo: params.dateTo });
    }
    if (params.search) {
      qb.andWhere('o.order_number ILIKE :search', { search: `%${params.search}%` });
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
    return { items: orms.map(OrderMapper.toDomain), total };
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
    const orms = await this.itemRepo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
    return orms.map(OrderItemMapper.toDomain);
  }

  async findEventsByOrderId(orderId: string): Promise<OrderEvent[]> {
    const orms = await this.eventRepo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
    return orms.map(OrderEventMapper.toDomain);
  }

  async atomicStatusTransition(orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus): Promise<boolean> {
    const result = await this.orderRepo
      .createQueryBuilder()
      .update(OrderOrmEntity)
      .set({ status: toStatus, updatedAt: new Date() })
      .where('id = :orderId', { orderId })
      .andWhere('status = :fromStatus', { fromStatus })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async atomicStockDecrement(productId: string, quantity: number): Promise<boolean> {
    const result = await this.orderRepo.manager.query(
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

  async findPendingExpired(thresholdDate: Date, limit: number): Promise<Order[]> {
    const orms = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'pending' })
      .andWhere('o.created_at < :threshold', { threshold: thresholdDate })
      .orderBy('o.created_at', 'ASC')
      .take(limit)
      .getMany();
    return orms.map(OrderMapper.toDomain);
  }

  async countUserOrdersWithCoupon(userId: string, couponId: string): Promise<number> {
    return this.orderRepo
      .createQueryBuilder('o')
      .where('o.user_id = :userId', { userId })
      .andWhere('o.coupon_id = :couponId', { couponId })
      .andWhere('o.status != :cancelled', { cancelled: 'cancelled' })
      .getCount();
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
