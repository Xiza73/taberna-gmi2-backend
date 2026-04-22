import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Banner } from '../../domain/entities/banner.entity';
import { type IBannerRepository } from '../../domain/interfaces/banner-repository.interface';
import { BannerOrmEntity } from '../orm-entities/banner.orm-entity';
import { BannerMapper } from '../mappers/banner.mapper';

@Injectable()
export class BannerRepository implements IBannerRepository {
  constructor(
    @InjectRepository(BannerOrmEntity)
    private readonly repo: Repository<BannerOrmEntity>,
  ) {}

  async save(entity: Banner): Promise<Banner> {
    const orm = BannerMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return BannerMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Banner | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? BannerMapper.toDomain(orm) : null;
  }

  async findAllActive(): Promise<Banner[]> {
    const now = new Date();
    const qb = this.repo.createQueryBuilder('b');

    qb.where('b.is_active = true');
    qb.andWhere('(b.start_date IS NULL OR b.start_date <= :now)', { now });
    qb.andWhere('(b.end_date IS NULL OR b.end_date >= :now)', { now });
    qb.orderBy('b.sort_order', 'ASC');

    const orms = await qb.getMany();
    return orms.map((orm) => BannerMapper.toDomain(orm));
  }

  async findAll(params: {
    page: number;
    limit: number;
    includeInactive?: boolean;
  }): Promise<{ items: Banner[]; total: number }> {
    const qb = this.repo.createQueryBuilder('b');

    if (!params.includeInactive) {
      qb.andWhere('b.is_active = true');
    }

    qb.orderBy('b.sort_order', 'ASC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => BannerMapper.toDomain(orm)), total };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(BannerOrmEntity);
    const clone = new BannerRepository(repo) as this;
    return clone;
  }
}
