import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Review } from '../entities/review.entity';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface IReviewRepository extends IBaseRepository<Review> {
  findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null>;
  findApprovedByProductId(
    productId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: Review[]; total: number }>;
  findPending(params: {
    page: number;
    limit: number;
  }): Promise<{ items: Review[]; total: number }>;
  countApprovedByProductId(productId: string): Promise<number>;
  averageRatingByProductId(productId: string): Promise<number | null>;
}
