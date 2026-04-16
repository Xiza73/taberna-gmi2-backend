import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';

import { REVIEW_REPOSITORY, type IReviewRepository } from '../../domain/interfaces/review-repository.interface.js';
import { ReviewResponseDto } from '../dtos/review-response.dto.js';

@Injectable()
export class ApproveReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new DomainNotFoundException(ErrorMessages.REVIEW_NOT_FOUND);
    }

    review.approve();
    const saved = await this.reviewRepository.save(review);

    await this.recalculateProductRating(review.productId);

    return new ReviewResponseDto(saved);
  }

  private async recalculateProductRating(productId: string): Promise<void> {
    const averageRating = await this.reviewRepository.averageRatingByProductId(productId);
    const totalReviews = await this.reviewRepository.countApprovedByProductId(productId);

    const product = await this.productRepository.findById(productId);
    if (product) {
      product.updateRating(averageRating, totalReviews);
      await this.productRepository.save(product);
    }
  }
}
