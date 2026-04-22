import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  CART_REPOSITORY,
  type ICartRepository,
} from '../../domain/interfaces/cart-repository.interface';

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string, itemId: string): Promise<void> {
    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    const item = await this.cartRepository.findItemById(itemId);

    if (!item || item.cartId !== cart.id) {
      throw new DomainNotFoundException(ErrorMessages.CART_ITEM_NOT_FOUND);
    }

    await this.cartRepository.removeItem(itemId);
  }
}
