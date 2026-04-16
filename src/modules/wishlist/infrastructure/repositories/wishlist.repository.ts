import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type WishlistItem } from '../../domain/entities/wishlist-item.entity.js';
import { type IWishlistRepository } from '../../domain/interfaces/wishlist-repository.interface.js';
import { WishlistItemOrmEntity } from '../orm-entities/wishlist-item.orm-entity.js';
import { WishlistItemMapper } from '../mappers/wishlist-item.mapper.js';

@Injectable()
export class WishlistRepository implements IWishlistRepository {
  constructor(
    @InjectRepository(WishlistItemOrmEntity)
    private readonly repo: Repository<WishlistItemOrmEntity>,
  ) {}

  async findAllByUserId(userId: string): Promise<WishlistItem[]> {
    const orms = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => WishlistItemMapper.toDomain(orm));
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<WishlistItem | null> {
    const orm = await this.repo.findOne({ where: { userId, productId } });
    return orm ? WishlistItemMapper.toDomain(orm) : null;
  }

  async save(entity: WishlistItem): Promise<WishlistItem> {
    const orm = WishlistItemMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return WishlistItemMapper.toDomain(saved);
  }

  async deleteByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<void> {
    await this.repo.delete({ userId, productId });
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(WishlistItemOrmEntity);
    const clone = new WishlistRepository(repo) as this;
    return clone;
  }
}
