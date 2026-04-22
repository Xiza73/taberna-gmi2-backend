import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';

import { GetCartUseCase } from '../application/use-cases/get-cart.use-case';
import { AddCartItemUseCase } from '../application/use-cases/add-cart-item.use-case';
import { UpdateCartItemUseCase } from '../application/use-cases/update-cart-item.use-case';
import { RemoveCartItemUseCase } from '../application/use-cases/remove-cart-item.use-case';
import { ClearCartUseCase } from '../application/use-cases/clear-cart.use-case';
import { AddCartItemDto } from '../application/dtos/add-cart-item.dto';
import { UpdateCartItemDto } from '../application/dtos/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addCartItemUseCase: AddCartItemUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    const result = await this.getCartUseCase.execute(userId);
    return BaseResponse.ok(result);
  }

  @Post('items')
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCartItemDto,
  ) {
    await this.addCartItemUseCase.execute(userId, dto);
    return BaseResponse.ok(null, 'Item added to cart');
  }

  @Patch('items/:id')
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    await this.updateCartItemUseCase.execute(userId, itemId, dto);
    return BaseResponse.ok(null, 'Cart item updated');
  }

  @Delete('items/:id')
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) itemId: string,
  ) {
    await this.removeCartItemUseCase.execute(userId, itemId);
    return BaseResponse.ok(null, 'Cart item removed');
  }

  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    await this.clearCartUseCase.execute(userId);
    return BaseResponse.ok(null, 'Cart cleared');
  }
}
