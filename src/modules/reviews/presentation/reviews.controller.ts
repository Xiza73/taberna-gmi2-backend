import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';
import { Public } from '@shared/presentation/decorators/public.decorator.js';

import { CreateReviewUseCase } from '../application/use-cases/create-review.use-case.js';
import { ListProductReviewsUseCase } from '../application/use-cases/list-product-reviews.use-case.js';
import { CreateReviewDto } from '../application/dtos/create-review.dto.js';

@Controller('products')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly listProductReviewsUseCase: ListProductReviewsUseCase,
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
}
