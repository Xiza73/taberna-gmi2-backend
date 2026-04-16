import { type Review } from '../../domain/entities/review.entity.js';

export class ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(review: Review) {
    this.id = review.id;
    this.userId = review.userId;
    this.productId = review.productId;
    this.orderId = review.orderId;
    this.rating = review.rating;
    this.comment = review.comment;
    this.isApproved = review.isApproved;
    this.createdAt = review.createdAt.toISOString();
    this.updatedAt = review.updatedAt.toISOString();
  }
}
