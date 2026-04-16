import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Cart } from '../entities/cart.entity.js';
import { type CartItem } from '../entities/cart-item.entity.js';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface ICartRepository {
  findOrCreateByUserId(userId: string): Promise<Cart>;
  findItemsByCartId(cartId: string): Promise<CartItem[]>;
  findItemById(itemId: string): Promise<CartItem | null>;
  findItemByCartAndProduct(
    cartId: string,
    productId: string,
  ): Promise<CartItem | null>;
  saveItem(item: CartItem): Promise<CartItem>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  withTransaction(ctx: TransactionContext): this;
}
