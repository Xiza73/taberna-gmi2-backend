import { Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface.js';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '@modules/categories/domain/interfaces/category-repository.interface.js';

@Injectable()
export class ReindexProductsUseCase {
  private readonly logger = new Logger(ReindexProductsUseCase.name);
  private readonly index = 'products';

  constructor(
    private readonly elasticsearch: ElasticsearchService,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(): Promise<{ indexed: number }> {
    // Delete and recreate index
    try {
      await this.elasticsearch.indices.delete({ index: this.index });
    } catch {
      // Index may not exist
    }

    await this.elasticsearch.indices.create({
      index: this.index,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: {
            type: 'text',
            analyzer: 'spanish',
            fields: { suggest: { type: 'search_as_you_type' } },
          },
          slug: { type: 'keyword' },
          description: { type: 'text', analyzer: 'spanish' },
          price: { type: 'integer' },
          images: { type: 'keyword' },
          categoryId: { type: 'keyword' },
          categoryName: { type: 'keyword' },
          isActive: { type: 'boolean' },
          averageRating: { type: 'float' },
          totalReviews: { type: 'integer' },
          stock: { type: 'integer' },
          createdAt: { type: 'date' },
        },
      },
    });

    // Fetch all categories for name lookup
    const categories = await this.categoryRepository.findAllActive();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Batch index products
    let indexed = 0;
    let page = 1;
    const batchSize = 100;

    while (true) {
      const result = await this.productRepository.findAll({
        page,
        limit: batchSize,
        includeInactive: false,
      });
      if (result.items.length === 0) break;

      const operations = result.items.flatMap((product) => [
        { index: { _index: this.index, _id: product.id } },
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          images: product.images,
          categoryId: product.categoryId,
          categoryName: categoryMap.get(product.categoryId) ?? '',
          isActive: product.isActive,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          stock: product.stock,
          createdAt: product.createdAt.toISOString(),
        },
      ]);

      await this.elasticsearch.bulk({ operations });
      indexed += result.items.length;

      this.logger.log(`Indexed ${indexed} products...`);

      if (result.items.length < batchSize) break;
      page++;
    }

    this.logger.log(`Reindex complete: ${indexed} products indexed`);
    return { indexed };
  }
}
