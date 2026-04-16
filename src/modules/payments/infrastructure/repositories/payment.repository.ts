import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Payment } from '../../domain/entities/payment.entity.js';
import { type IPaymentRepository } from '../../domain/interfaces/payment-repository.interface.js';
import { PaymentOrmEntity } from '../orm-entities/payment.orm-entity.js';
import { PaymentMapper } from '../mappers/payment.mapper.js';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly repo: Repository<PaymentOrmEntity>,
  ) {}

  async save(entity: Payment): Promise<Payment> {
    const orm = PaymentMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return PaymentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? PaymentMapper.toDomain(orm) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const orm = await this.repo.findOne({ where: { orderId } });
    return orm ? PaymentMapper.toDomain(orm) : null;
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    const orm = await this.repo.findOne({ where: { externalId } });
    return orm ? PaymentMapper.toDomain(orm) : null;
  }

  async upsertByExternalId(payment: Payment): Promise<Payment> {
    const orm = PaymentMapper.toOrm(payment);
    const existing = orm.externalId
      ? await this.repo.findOne({ where: { externalId: orm.externalId } })
      : null;

    if (existing) {
      existing.status = orm.status;
      existing.method = orm.method;
      existing.paidAt = orm.paidAt;
      existing.rawResponse = orm.rawResponse;
      existing.updatedAt = orm.updatedAt;
      const saved = await this.repo.save(existing);
      return PaymentMapper.toDomain(saved);
    }

    const saved = await this.repo.save(orm);
    return PaymentMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(PaymentOrmEntity);
    const clone = new PaymentRepository(repo) as this;
    return clone;
  }
}
