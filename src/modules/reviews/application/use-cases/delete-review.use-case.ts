import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface.js';

import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
} from '../../domain/interfaces/review-repository.interface.js';

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new DomainNotFoundException(ErrorMessages.REVIEW_NOT_FOUND);
    }

    const wasApproved = review.isApproved;
    await this.reviewRepository.delete(reviewId);

    if (wasApproved) {
      await this.recalculateProductRating(review.productId);
    }
  }

  private async recalculateProductRating(productId: string): Promise<void> {
    const averageRating =
      await this.reviewRepository.averageRatingByProductId(productId);
    const totalReviews =
      await this.reviewRepository.countApprovedByProductId(productId);

    const product = await this.productRepository.findById(productId);
    if (product) {
      product.updateRating(averageRating, totalReviews);
      await this.productRepository.save(product);
    }
  }
}
