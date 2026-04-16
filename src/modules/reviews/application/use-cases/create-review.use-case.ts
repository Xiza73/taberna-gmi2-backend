import { Inject, Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

import { DomainConflictException, DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';
import { ORDER_REPOSITORY, type IOrderRepository } from '@modules/orders/domain/interfaces/order-repository.interface.js';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum.js';

import { Review } from '../../domain/entities/review.entity.js';
import { REVIEW_REPOSITORY, type IReviewRepository } from '../../domain/interfaces/review-repository.interface.js';
import { type CreateReviewDto } from '../dtos/create-review.dto.js';
import { ReviewResponseDto } from '../dtos/review-response.dto.js';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: string, productId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    // Verify product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    // Check if already reviewed
    const existing = await this.reviewRepository.findByUserAndProduct(userId, productId);
    if (existing) {
      throw new DomainConflictException(ErrorMessages.REVIEW_ALREADY_EXISTS);
    }

    // Find a delivered order with this product
    const userOrders = await this.orderRepository.findAllByUserId({ userId, page: 1, limit: 100, status: OrderStatus.DELIVERED });
    let orderId: string | null = null;

    for (const order of userOrders.items) {
      const items = await this.orderRepository.findItemsByOrderId(order.id);
      if (items.some((item) => item.productId === productId)) {
        orderId = order.id;
        break;
      }
    }

    if (!orderId) {
      throw new DomainException(ErrorMessages.REVIEW_NOT_PURCHASED);
    }

    // Sanitize comment (strip all HTML)
    const sanitizedComment = dto.comment ? sanitizeHtml(dto.comment, { allowedTags: [], allowedAttributes: {} }) : null;

    const review = Review.create({
      userId,
      productId,
      orderId,
      rating: dto.rating,
      comment: sanitizedComment,
    });

    const saved = await this.reviewRepository.save(review);
    return new ReviewResponseDto(saved);
  }
}
