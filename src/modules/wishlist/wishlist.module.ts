import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '@modules/products/products.module.js';

import { WishlistItemOrmEntity } from './infrastructure/orm-entities/wishlist-item.orm-entity.js';
import { WishlistRepository } from './infrastructure/repositories/wishlist.repository.js';
import { WISHLIST_REPOSITORY } from './domain/interfaces/wishlist-repository.interface.js';
import { ListWishlistUseCase } from './application/use-cases/list-wishlist.use-case.js';
import { AddToWishlistUseCase } from './application/use-cases/add-to-wishlist.use-case.js';
import { RemoveFromWishlistUseCase } from './application/use-cases/remove-from-wishlist.use-case.js';
import { WishlistController } from './presentation/wishlist.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistItemOrmEntity]),
    ProductsModule,
  ],
  controllers: [WishlistController],
  providers: [
    { provide: WISHLIST_REPOSITORY, useClass: WishlistRepository },
    ListWishlistUseCase,
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
  ],
  exports: [WISHLIST_REPOSITORY],
})
export class WishlistModule {}
