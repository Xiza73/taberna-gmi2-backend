import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';

import { ReviewOrmEntity } from './infrastructure/orm-entities/review.orm-entity';
import { ReviewRepository } from './infrastructure/repositories/review.repository';
import { REVIEW_REPOSITORY } from './domain/interfaces/review-repository.interface';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { ListProductReviewsUseCase } from './application/use-cases/list-product-reviews.use-case';
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case';
import { DeleteOwnReviewUseCase } from './application/use-cases/delete-own-review.use-case';
import { AdminListReviewsUseCase } from './application/use-cases/admin-list-reviews.use-case';
import { ApproveReviewUseCase } from './application/use-cases/approve-review.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ReviewsController } from './presentation/reviews.controller';
import { AdminReviewsController } from './presentation/admin-reviews.controller';

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
    UpdateReviewUseCase,
    DeleteOwnReviewUseCase,
    AdminListReviewsUseCase,
    ApproveReviewUseCase,
    DeleteReviewUseCase,
  ],
  exports: [REVIEW_REPOSITORY],
})
export class ReviewsModule {}
