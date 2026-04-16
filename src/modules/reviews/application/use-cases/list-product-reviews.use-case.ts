import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';

import { REVIEW_REPOSITORY, type IReviewRepository } from '../../domain/interfaces/review-repository.interface.js';
import { ReviewResponseDto } from '../dtos/review-response.dto.js';

@Injectable()
export class ListProductReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(productId: string, page: number, limit: number): Promise<{ items: ReviewResponseDto[]; total: number }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    const result = await this.reviewRepository.findApprovedByProductId(productId, { page, limit });
    return {
      items: result.items.map((r) => new ReviewResponseDto(r)),
      total: result.total,
    };
  }
}
