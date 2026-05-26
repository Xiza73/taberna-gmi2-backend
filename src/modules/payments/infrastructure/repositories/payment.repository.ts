import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Payment } from '../../domain/entities/payment.entity';
import { type IPaymentRepository } from '../../domain/interfaces/payment-repository.interface';
import { PaymentOrmEntity } from '../orm-entities/payment.orm-entity';
import { PaymentMapper } from '../mappers/payment.mapper';

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

    // Race condition: MP envía múltiples webhooks por el mismo payment_id
    // (uno por protocolo: WebHook v1.0 y Feed v2.0) casi simultáneamente.
    // Si dos llegan en paralelo, ambos pasan el findOne anterior sin ver
    // el otro, ambos intentan INSERT y el segundo crashea por unique
    // constraint en uq_payments_external_id. Capturamos ese caso y
    // tratamos como "ya procesado" (re-query del que ganó la carrera).
    try {
      const saved = await this.repo.save(orm);
      return PaymentMapper.toDomain(saved);
    } catch (err: unknown) {
      const isDuplicate =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === '23505';
      if (isDuplicate && orm.externalId) {
        const winner = await this.repo.findOne({
          where: { externalId: orm.externalId },
        });
        if (winner) {
          return PaymentMapper.toDomain(winner);
        }
      }
      throw err;
    }
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
