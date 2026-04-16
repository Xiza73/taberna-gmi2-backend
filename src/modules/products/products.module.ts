import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesModule } from '@modules/categories/categories.module.js';
import { SearchModule } from '@modules/search/search.module.js';

import { ProductOrmEntity } from './infrastructure/orm-entities/product.orm-entity.js';
import { ProductRepository } from './infrastructure/repositories/product.repository.js';
import { PRODUCT_REPOSITORY } from './domain/interfaces/product-repository.interface.js';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case.js';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case.js';
import { AdminListProductsUseCase } from './application/use-cases/admin-list-products.use-case.js';
import { AdminGetProductUseCase } from './application/use-cases/admin-get-product.use-case.js';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case.js';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case.js';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case.js';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock.use-case.js';
import { ProductsController } from './presentation/products.controller.js';
import { AdminProductsController } from './presentation/admin-products.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductOrmEntity]),
    CategoriesModule,
    forwardRef(() => SearchModule),
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepository },
    ListProductsUseCase,
    GetProductBySlugUseCase,
    AdminListProductsUseCase,
    AdminGetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    AdjustStockUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
