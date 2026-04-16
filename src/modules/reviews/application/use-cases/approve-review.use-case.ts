import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { UNIT_OF_WORK, type IUnitOfWork, type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';

import { REVIEW_REPOSITORY, type IReviewRepository } from '../../domain/interfaces/review-repository.interface.js';
import { ReviewResponseDto } from '../dtos/review-response.dto.js';

@Injectable()
export class ApproveReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new DomainNotFoundException(ErrorMessages.REVIEW_NOT_FOUND);
    }

    review.approve();

    const saved = await this.unitOfWork.execute(async (ctx: TransactionContext) => {
      const reviewRepo = this.reviewRepository.withTransaction(ctx);
      const productRepo = this.productRepository.withTransaction(ctx);

      const savedReview = await reviewRepo.save(review);

      const averageRating = await reviewRepo.averageRatingByProductId(review.productId);
      const totalReviews = await reviewRepo.countApprovedByProductId(review.productId);

      const product = await productRepo.findById(review.productId);
      if (product) {
        product.updateRating(averageRating, totalReviews);
        await productRepo.save(product);
      }

      return savedReview;
    });

    return new ReviewResponseDto(saved);
  }
}
