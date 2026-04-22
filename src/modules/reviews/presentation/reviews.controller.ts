import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { CreateReviewUseCase } from '../application/use-cases/create-review.use-case';
import { ListProductReviewsUseCase } from '../application/use-cases/list-product-reviews.use-case';
import { UpdateReviewUseCase } from '../application/use-cases/update-review.use-case';
import { DeleteOwnReviewUseCase } from '../application/use-cases/delete-own-review.use-case';
import { CreateReviewDto } from '../application/dtos/create-review.dto';
import { UpdateReviewDto } from '../application/dtos/update-review.dto';

@Controller('products')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly listProductReviewsUseCase: ListProductReviewsUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteOwnReviewUseCase: DeleteOwnReviewUseCase,
  ) {}

  @Post(':id/reviews')
  async create(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const result = await this.createReviewUseCase.execute(
      userId,
      productId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Public()
  @Get(':id/reviews')
  async list(
    @Param('id', ParseUUIDPipe) productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.listProductReviewsUseCase.execute(
      productId,
      page,
      limit,
    );
    return BaseResponse.ok(result);
  }

  @Patch(':productId/reviews/:reviewId')
  async update(
    @CurrentUser('id') userId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const result = await this.updateReviewUseCase.execute(
      userId,
      reviewId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Delete(':productId/reviews/:reviewId')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    await this.deleteOwnReviewUseCase.execute(userId, reviewId);
    return BaseResponse.ok(null, 'Review deleted successfully');
  }
}
