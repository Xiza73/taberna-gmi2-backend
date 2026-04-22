import { Inject, Injectable } from '@nestjs/common';

import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  CART_REPOSITORY,
  type ICartRepository,
} from '../../domain/interfaces/cart-repository.interface';

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    const items = await this.cartRepository.findItemsByCartId(cart.id);

    if (items.length === 0) {
      throw new DomainException(ErrorMessages.CART_EMPTY);
    }

    await this.cartRepository.clearCart(cart.id);
  }
}
