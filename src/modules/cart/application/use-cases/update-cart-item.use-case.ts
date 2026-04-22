import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';

import {
  CART_REPOSITORY,
  type ICartRepository,
} from '../../domain/interfaces/cart-repository.interface';

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    userId: string,
    itemId: string,
    dto: { quantity: number },
  ): Promise<void> {
    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    const item = await this.cartRepository.findItemById(itemId);

    if (!item || item.cartId !== cart.id) {
      throw new DomainNotFoundException(ErrorMessages.CART_ITEM_NOT_FOUND);
    }

    const product = await this.productRepository.findById(item.productId);
    if (!product || !product.isActive) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    if (dto.quantity > product.stock) {
      throw new DomainException(ErrorMessages.INSUFFICIENT_STOCK);
    }

    item.updateQuantity(dto.quantity);
    await this.cartRepository.saveItem(item);
  }
}
