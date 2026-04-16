import { Review } from '../../domain/entities/review.entity.js';
import { ReviewOrmEntity } from '../orm-entities/review.orm-entity.js';

export class ReviewMapper {
  static toDomain(orm: ReviewOrmEntity): Review {
    return Review.reconstitute({
      id: orm.id,
      userId: orm.userId,
      productId: orm.productId,
      orderId: orm.orderId,
      rating: orm.rating,
      comment: orm.comment,
      isApproved: orm.isApproved,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Review): ReviewOrmEntity {
    const orm = new ReviewOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.productId = domain.productId;
    orm.orderId = domain.orderId;
    orm.rating = domain.rating;
    orm.comment = domain.comment;
    orm.isApproved = domain.isApproved;
    return orm;
  }
}
