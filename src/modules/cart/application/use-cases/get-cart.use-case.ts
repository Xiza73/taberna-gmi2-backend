import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';

import {
  CART_REPOSITORY,
  type ICartRepository,
} from '../../domain/interfaces/cart-repository.interface';
import {
  CartResponseDto,
  CartItemResponseDto,
} from '../dtos/cart-response.dto';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    const items = await this.cartRepository.findItemsByCartId(cart.id);

    const responseItems: CartItemResponseDto[] = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive) continue;

      responseItems.push(
        new CartItemResponseDto({
          id: item.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0] ?? null,
          price: product.price,
          quantity: item.quantity,
        }),
      );
    }

    return new CartResponseDto(responseItems);
  }
}
