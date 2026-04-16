import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Review } from '../../domain/entities/review.entity.js';
import { type IReviewRepository } from '../../domain/interfaces/review-repository.interface.js';
import { ReviewOrmEntity } from '../orm-entities/review.orm-entity.js';
import { ReviewMapper } from '../mappers/review.mapper.js';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly repo: Repository<ReviewOrmEntity>,
  ) {}

  async save(entity: Review): Promise<Review> {
    const orm = ReviewMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return ReviewMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Review | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? ReviewMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null> {
    const orm = await this.repo.findOne({ where: { userId, productId } });
    return orm ? ReviewMapper.toDomain(orm) : null;
  }

  async findApprovedByProductId(
    productId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: Review[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      where: { productId, isApproved: true },
      order: { createdAt: 'DESC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return { items: orms.map((orm) => ReviewMapper.toDomain(orm)), total };
  }

  async findPending(params: {
    page: number;
    limit: number;
  }): Promise<{ items: Review[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      where: { isApproved: false },
      order: { createdAt: 'ASC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return { items: orms.map((orm) => ReviewMapper.toDomain(orm)), total };
  }

  async countApprovedByProductId(productId: string): Promise<number> {
    return this.repo.count({ where: { productId, isApproved: true } });
  }

  async averageRatingByProductId(productId: string): Promise<number | null> {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.product_id = :productId', { productId })
      .andWhere('r.is_approved = true')
      .getRawOne<{ avg: string | null }>();
    return result?.avg !== null && result?.avg !== undefined
      ? parseFloat(Number(result.avg).toFixed(2))
      : null;
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(ReviewOrmEntity);
    const clone = new ReviewRepository(repo) as this;
    return clone;
  }
}
