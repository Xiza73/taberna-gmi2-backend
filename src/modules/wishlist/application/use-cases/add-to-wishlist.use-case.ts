import { Inject, Injectable } from '@nestjs/common';

import {
  DomainConflictException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';

import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import {
  WISHLIST_REPOSITORY,
  type IWishlistRepository,
} from '../../domain/interfaces/wishlist-repository.interface';

@Injectable()
export class AddToWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY)
    private readonly wishlistRepository: IWishlistRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    const existing = await this.wishlistRepository.findByUserAndProduct(
      userId,
      productId,
    );
    if (existing) {
      throw new DomainConflictException(
        ErrorMessages.WISHLIST_ITEM_ALREADY_EXISTS,
      );
    }

    const item = WishlistItem.create({ userId, productId });
    await this.wishlistRepository.save(item);
  }
}
