import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Coupon } from '../../domain/entities/coupon.entity';
import { type ICouponRepository } from '../../domain/interfaces/coupon-repository.interface';
import { CouponOrmEntity } from '../orm-entities/coupon.orm-entity';
import { CouponMapper } from '../mappers/coupon.mapper';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(
    @InjectRepository(CouponOrmEntity)
    private readonly repo: Repository<CouponOrmEntity>,
  ) {}

  async save(entity: Coupon): Promise<Coupon> {
    const orm = CouponMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return CouponMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Coupon | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? CouponMapper.toDomain(orm) : null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const orm = await this.repo.findOne({
      where: { code: code.toUpperCase() },
    });
    return orm ? CouponMapper.toDomain(orm) : null;
  }

  async codeExists(code: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.code = :code', { code: code.toUpperCase() });

    if (excludeId) {
      qb.andWhere('c.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async findAll(params: {
    page: number;
    limit: number;
  }): Promise<{ items: Coupon[]; total: number }> {
    const qb = this.repo.createQueryBuilder('c');

    qb.orderBy('c.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => CouponMapper.toDomain(orm)), total };
  }

  async findActive(params: {
    page: number;
    limit: number;
  }): Promise<{ items: Coupon[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.is_active = :isActive', { isActive: true })
      .andWhere('c.start_date <= NOW()')
      .andWhere('c.end_date >= NOW()')
      .andWhere('(c.max_uses IS NULL OR c.current_uses < c.max_uses)');

    qb.orderBy('c.end_date', 'ASC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => CouponMapper.toDomain(orm)), total };
  }

  async findByIdForUpdate(id: string): Promise<Coupon | null> {
    const orm = await this.repo
      .createQueryBuilder('c')
      .setLock('pessimistic_write')
      .where('c.id = :id', { id })
      .getOne();
    return orm ? CouponMapper.toDomain(orm) : null;
  }

  async incrementUses(id: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(CouponOrmEntity)
      .set({ currentUses: () => 'current_uses + 1' })
      .where('id = :id', { id })
      .andWhere('(max_uses IS NULL OR current_uses < max_uses)')
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async decrementUses(id: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(CouponOrmEntity)
      .set({ currentUses: () => 'current_uses - 1' })
      .where('id = :id', { id })
      .andWhere('current_uses > 0')
      .execute();
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(CouponOrmEntity);
    const clone = new CouponRepository(repo) as this;
    return clone;
  }
}
