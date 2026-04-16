import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type WishlistItem } from '../entities/wishlist-item.entity.js';

export const WISHLIST_REPOSITORY = Symbol('WISHLIST_REPOSITORY');

export interface IWishlistRepository {
  findAllByUserId(userId: string): Promise<WishlistItem[]>;
  findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<WishlistItem | null>;
  save(entity: WishlistItem): Promise<WishlistItem>;
  deleteByUserAndProduct(userId: string, productId: string): Promise<void>;
  withTransaction(ctx: TransactionContext): this;
}
