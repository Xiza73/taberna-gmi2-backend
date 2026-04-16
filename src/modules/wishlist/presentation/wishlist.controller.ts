import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';

import { ListWishlistUseCase } from '../application/use-cases/list-wishlist.use-case.js';
import { AddToWishlistUseCase } from '../application/use-cases/add-to-wishlist.use-case.js';
import { RemoveFromWishlistUseCase } from '../application/use-cases/remove-from-wishlist.use-case.js';

@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly listWishlistUseCase: ListWishlistUseCase,
    private readonly addToWishlistUseCase: AddToWishlistUseCase,
    private readonly removeFromWishlistUseCase: RemoveFromWishlistUseCase,
  ) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    const result = await this.listWishlistUseCase.execute(userId);
    return BaseResponse.ok(result);
  }

  @Post(':productId')
  async add(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    await this.addToWishlistUseCase.execute(userId, productId);
    return BaseResponse.ok(null, 'Product added to wishlist');
  }

  @Delete(':productId')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    await this.removeFromWishlistUseCase.execute(userId, productId);
    return BaseResponse.ok(null, 'Product removed from wishlist');
  }
}
