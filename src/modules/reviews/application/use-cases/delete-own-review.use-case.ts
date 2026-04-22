import { Inject, Injectable } from '@nestjs/common';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
} from '../../domain/interfaces/review-repository.interface';

@Injectable()
export class DeleteOwnReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review)
      throw new DomainNotFoundException(ErrorMessages.REVIEW_NOT_FOUND);

    if (review.userId !== userId) {
      throw new DomainForbiddenException(
        'You can only delete your own reviews',
      );
    }

    await this.reviewRepository.delete(reviewId);
  }
}
