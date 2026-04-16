import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '@modules/products/products.module.js';
import { OrdersModule } from '@modules/orders/orders.module.js';

import { ReviewOrmEntity } from './infrastructure/orm-entities/review.orm-entity.js';
import { ReviewRepository } from './infrastructure/repositories/review.repository.js';
import { REVIEW_REPOSITORY } from './domain/interfaces/review-repository.interface.js';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case.js';
import { ListProductReviewsUseCase } from './application/use-cases/list-product-reviews.use-case.js';
import { AdminListPendingReviewsUseCase } from './application/use-cases/admin-list-pending-reviews.use-case.js';
import { ApproveReviewUseCase } from './application/use-cases/approve-review.use-case.js';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case.js';
import { ReviewsController } from './presentation/reviews.controller.js';
import { AdminReviewsController } from './presentation/admin-reviews.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewOrmEntity]),
    ProductsModule,
    OrdersModule,
  ],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [
    { provide: REVIEW_REPOSITORY, useClass: ReviewRepository },
    CreateReviewUseCase,
    ListProductReviewsUseCase,
    AdminListPendingReviewsUseCase,
    ApproveReviewUseCase,
    DeleteReviewUseCase,
  ],
  exports: [REVIEW_REPOSITORY],
})
export class ReviewsModule {}
