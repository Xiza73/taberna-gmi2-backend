import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Review } from '../../domain/entities/review.entity';
import { type IReviewRepository } from '../../domain/interfaces/review-repository.interface';
import { ReviewOrmEntity } from '../orm-entities/review.orm-entity';
import { ReviewMapper } from '../mappers/review.mapper';

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

  async findAllAdmin(params: {
    page: number;
    limit: number;
    isApproved?: boolean;
    productId?: string;
    rating?: number;
  }): Promise<{ items: Review[]; total: number }> {
    const qb = this.repo.createQueryBuilder('r');

    // Default to pending-only when isApproved is not specified, preserving the
    // historic AdminListPendingReviewsUseCase behavior. Front can opt in to
    // seeing approved reviews by passing ?isApproved=true.
    const isApprovedFilter =
      params.isApproved === undefined ? false : params.isApproved;
    qb.where('r.is_approved = :isApproved', { isApproved: isApprovedFilter });

    if (params.productId) {
      qb.andWhere('r.product_id = :productId', { productId: params.productId });
    }
    if (params.rating !== undefined) {
      qb.andWhere('r.rating = :rating', { rating: params.rating });
    }

    qb.orderBy('r.created_at', isApprovedFilter ? 'DESC' : 'ASC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
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
