import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '@modules/products/products.module';

import { CartOrmEntity } from './infrastructure/orm-entities/cart.orm-entity';
import { CartItemOrmEntity } from './infrastructure/orm-entities/cart-item.orm-entity';
import { CartRepository } from './infrastructure/repositories/cart.repository';
import { CART_REPOSITORY } from './domain/interfaces/cart-repository.interface';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { UpdateCartItemUseCase } from './application/use-cases/update-cart-item.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { CartController } from './presentation/cart.controller';

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
