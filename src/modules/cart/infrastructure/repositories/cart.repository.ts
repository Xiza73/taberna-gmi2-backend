import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { Cart } from '../../domain/entities/cart.entity.js';
import { type CartItem } from '../../domain/entities/cart-item.entity.js';
import { type ICartRepository } from '../../domain/interfaces/cart-repository.interface.js';
import { CartOrmEntity } from '../orm-entities/cart.orm-entity.js';
import { CartItemOrmEntity } from '../orm-entities/cart-item.orm-entity.js';
import { CartMapper } from '../mappers/cart.mapper.js';
import { CartItemMapper } from '../mappers/cart-item.mapper.js';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartOrmEntity)
    private readonly cartRepo: Repository<CartOrmEntity>,
    @InjectRepository(CartItemOrmEntity)
    private readonly itemRepo: Repository<CartItemOrmEntity>,
  ) {}

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    let orm = await this.cartRepo.findOne({ where: { userId } });
    if (!orm) {
      try {
        const cart = Cart.create({ userId });
        const cartOrm = CartMapper.toOrm(cart);
        orm = await this.cartRepo.save(cartOrm);
      } catch {
        // Race condition: another request created the cart — fetch it
        orm = await this.cartRepo.findOne({ where: { userId } });
        if (!orm) throw new Error('Failed to find or create cart');
      }
    }
    return CartMapper.toDomain(orm);
  }

  async findItemsByCartId(cartId: string): Promise<CartItem[]> {
    const orms = await this.itemRepo.find({
      where: { cartId },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });
    return orms.map(CartItemMapper.toDomain);
  }

  async findItemById(itemId: string): Promise<CartItem | null> {
    const orm = await this.itemRepo.findOne({ where: { id: itemId } });
    return orm ? CartItemMapper.toDomain(orm) : null;
  }

  async findItemByCartAndProduct(cartId: string, productId: string): Promise<CartItem | null> {
    const orm = await this.itemRepo.findOne({ where: { cartId, productId } });
    return orm ? CartItemMapper.toDomain(orm) : null;
  }

  async saveItem(item: CartItem): Promise<CartItem> {
    const orm = CartItemMapper.toOrm(item);
    const saved = await this.itemRepo.save(orm);
    return CartItemMapper.toDomain(saved);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.itemRepo.delete(itemId);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.itemRepo.delete({ cartId });
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const cartRepo = manager.getRepository(CartOrmEntity);
    const itemRepo = manager.getRepository(CartItemOrmEntity);
    const clone = new CartRepository(cartRepo, itemRepo) as this;
    return clone;
  }
}
