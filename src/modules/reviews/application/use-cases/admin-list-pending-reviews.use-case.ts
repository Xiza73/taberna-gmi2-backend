import { Inject, Injectable } from '@nestjs/common';

import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
} from '../../domain/interfaces/review-repository.interface';
import { ReviewResponseDto } from '../dtos/review-response.dto';

@Injectable()
export class AdminListPendingReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(
    page: number,
    limit: number,
  ): Promise<{ items: ReviewResponseDto[]; total: number }> {
    const result = await this.reviewRepository.findPending({ page, limit });
    return {
      items: result.items.map((r) => new ReviewResponseDto(r)),
      total: result.total,
    };
  }
}
