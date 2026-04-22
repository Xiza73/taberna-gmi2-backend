import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesModule } from '@modules/categories/categories.module';
import { SearchModule } from '@modules/search/search.module';

import { ProductOrmEntity } from './infrastructure/orm-entities/product.orm-entity';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { PRODUCT_REPOSITORY } from './domain/interfaces/product-repository.interface';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case';
import { AdminListProductsUseCase } from './application/use-cases/admin-list-products.use-case';
import { AdminGetProductUseCase } from './application/use-cases/admin-get-product.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock.use-case';
import { ProductsController } from './presentation/products.controller';
import { AdminProductsController } from './presentation/admin-products.controller';

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
