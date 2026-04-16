import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';

import { WISHLIST_REPOSITORY, type IWishlistRepository } from '../../domain/interfaces/wishlist-repository.interface.js';
import { WishlistItemResponseDto } from '../dtos/wishlist-response.dto.js';

@Injectable()
export class ListWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepository: IWishlistRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string): Promise<WishlistItemResponseDto[]> {
    const items = await this.wishlistRepository.findAllByUserId(userId);

    const responseItems: WishlistItemResponseDto[] = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive) continue;

      responseItems.push(new WishlistItemResponseDto({
        id: item.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0] ?? null,
        price: product.price,
        addedAt: item.createdAt,
      }));
    }

    return responseItems;
  }
}
