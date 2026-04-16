import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '@modules/products/products.module.js';

import { CartOrmEntity } from './infrastructure/orm-entities/cart.orm-entity.js';
import { CartItemOrmEntity } from './infrastructure/orm-entities/cart-item.orm-entity.js';
import { CartRepository } from './infrastructure/repositories/cart.repository.js';
import { CART_REPOSITORY } from './domain/interfaces/cart-repository.interface.js';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case.js';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case.js';
import { UpdateCartItemUseCase } from './application/use-cases/update-cart-item.use-case.js';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case.js';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case.js';
import { CartController } from './presentation/cart.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartOrmEntity, CartItemOrmEntity]),
    ProductsModule,
  ],
  controllers: [CartController],
  providers: [
    { provide: CART_REPOSITORY, useClass: CartRepository },
    GetCartUseCase,
    AddCartItemUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
  ],
  exports: [CART_REPOSITORY],
})
export class CartModule {}
