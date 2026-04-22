import { Module, forwardRef } from '@nestjs/common';

import { ProductsModule } from '@modules/products/products.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { PRODUCT_SEARCH_SYNC } from '@modules/products/domain/interfaces/product-search-sync.interface';

import { PRODUCT_SEARCH } from './domain/interfaces/product-search.interface';
import { ElasticsearchProductSearch } from './infrastructure/services/elasticsearch-product-search';
import { ElasticsearchProductSync } from './infrastructure/services/elasticsearch-product-sync';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case';
import { SuggestProductsUseCase } from './application/use-cases/suggest-products.use-case';
import { ReindexProductsUseCase } from './application/use-cases/reindex-products.use-case';
import { SearchController } from './presentation/search.controller';
import { AdminSearchController } from './presentation/admin-search.controller';

@Module({
  imports: [forwardRef(() => ProductsModule), CategoriesModule],
  controllers: [SearchController, AdminSearchController],
  providers: [
    { provide: PRODUCT_SEARCH, useClass: ElasticsearchProductSearch },
    { provide: PRODUCT_SEARCH_SYNC, useClass: ElasticsearchProductSync },
    SearchProductsUseCase,
    SuggestProductsUseCase,
    ReindexProductsUseCase,
  ],
  exports: [PRODUCT_SEARCH_SYNC],
})
export class SearchModule {}
