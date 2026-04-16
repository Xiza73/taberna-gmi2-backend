import { Module, forwardRef } from '@nestjs/common';

import { ProductsModule } from '@modules/products/products.module.js';
import { CategoriesModule } from '@modules/categories/categories.module.js';
import { PRODUCT_SEARCH_SYNC } from '@modules/products/domain/interfaces/product-search-sync.interface.js';

import { PRODUCT_SEARCH } from './domain/interfaces/product-search.interface.js';
import { ElasticsearchProductSearch } from './infrastructure/services/elasticsearch-product-search.js';
import { ElasticsearchProductSync } from './infrastructure/services/elasticsearch-product-sync.js';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case.js';
import { SuggestProductsUseCase } from './application/use-cases/suggest-products.use-case.js';
import { ReindexProductsUseCase } from './application/use-cases/reindex-products.use-case.js';
import { SearchController } from './presentation/search.controller.js';
import { AdminSearchController } from './presentation/admin-search.controller.js';

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
