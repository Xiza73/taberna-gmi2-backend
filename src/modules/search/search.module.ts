import { Module } from '@nestjs/common';

import { ProductsModule } from '@modules/products/products.module';

import { PRODUCT_SEARCH } from './domain/interfaces/product-search.interface';
import { PostgresProductSearch } from './infrastructure/services/postgres-product-search';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case';
import { SuggestProductsUseCase } from './application/use-cases/suggest-products.use-case';
import { SearchController } from './presentation/search.controller';

@Module({
  imports: [ProductsModule],
  controllers: [SearchController],
  providers: [
    { provide: PRODUCT_SEARCH, useClass: PostgresProductSearch },
    SearchProductsUseCase,
    SuggestProductsUseCase,
  ],
})
export class SearchModule {}
