import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
} from '../../domain/interfaces/review-repository.interface';
import { type AdminReviewQueryDto } from '../dtos/admin-review-query.dto';
import { ReviewResponseDto } from '../dtos/review-response.dto';

@Injectable()
export class AdminListReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(
    query: AdminReviewQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.reviewRepository.findAllAdmin({
      page,
      limit,
      isApproved: query.isApproved,
      productId: query.productId,
      rating: query.rating,
    });

    return new PaginatedResponseDto(
      items.map((r) => new ReviewResponseDto(r)),
      total,
      page,
      limit,
    );
  }
}
