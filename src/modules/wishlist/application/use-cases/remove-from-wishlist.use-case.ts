import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  WISHLIST_REPOSITORY,
  type IWishlistRepository,
} from '../../domain/interfaces/wishlist-repository.interface';

@Injectable()
export class RemoveFromWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY)
    private readonly wishlistRepository: IWishlistRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const existing = await this.wishlistRepository.findByUserAndProduct(
      userId,
      productId,
    );
    if (!existing) {
      throw new DomainNotFoundException(ErrorMessages.WISHLIST_ITEM_NOT_FOUND);
    }

    await this.wishlistRepository.deleteByUserAndProduct(userId, productId);
  }
}
