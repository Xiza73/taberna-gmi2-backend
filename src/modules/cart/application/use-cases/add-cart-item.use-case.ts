import { Inject, Injectable } from '@nestjs/common';

import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';

import { CartItem } from '../../domain/entities/cart-item.entity.js';
import { CART_REPOSITORY, type ICartRepository } from '../../domain/interfaces/cart-repository.interface.js';

@Injectable()
export class AddCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string, dto: { productId: string; quantity: number }): Promise<void> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product || !product.isActive) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    const existingItem = await this.cartRepository.findItemByCartAndProduct(cart.id, dto.productId);

    const totalQuantity = existingItem ? existingItem.quantity + dto.quantity : dto.quantity;

    if (totalQuantity > product.stock) {
      throw new DomainException(ErrorMessages.INSUFFICIENT_STOCK);
    }

    if (existingItem) {
      existingItem.addQuantity(dto.quantity);
      await this.cartRepository.saveItem(existingItem);
    } else {
      const item = CartItem.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      });
      await this.cartRepository.saveItem(item);
    }
  }
}
