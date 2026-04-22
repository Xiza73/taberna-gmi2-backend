import { Inject, Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
} from '../../domain/interfaces/review-repository.interface';
import { type UpdateReviewDto } from '../dtos/update-review.dto';
import { ReviewResponseDto } from '../dtos/review-response.dto';

@Injectable()
export class UpdateReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review)
      throw new DomainNotFoundException(ErrorMessages.REVIEW_NOT_FOUND);

    if (review.userId !== userId) {
      throw new DomainForbiddenException('You can only edit your own reviews');
    }

    const sanitizedComment =
      dto.comment !== undefined
        ? sanitizeHtml(dto.comment, { allowedTags: [], allowedAttributes: {} })
        : undefined;

    review.update({ rating: dto.rating, comment: sanitizedComment });
    const saved = await this.reviewRepository.save(review);
    return new ReviewResponseDto(saved);
  }
}
