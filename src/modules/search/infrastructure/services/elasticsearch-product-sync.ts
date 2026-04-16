import { Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '@modules/categories/domain/interfaces/category-repository.interface.js';

import { type Product } from '@modules/products/domain/entities/product.entity.js';
import { type IProductSearchSync } from '@modules/products/domain/interfaces/product-search-sync.interface.js';

@Injectable()
export class ElasticsearchProductSync implements IProductSearchSync {
  private readonly logger = new Logger(ElasticsearchProductSync.name);
  private readonly index = 'products';

  constructor(
    private readonly elasticsearch: ElasticsearchService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async indexProduct(product: Product): Promise<void> {
    try {
      const category = await this.categoryRepository.findById(
        product.categoryId,
      );
      await this.elasticsearch.index({
        index: this.index,
        id: product.id,
        document: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          images: product.images,
          categoryId: product.categoryId,
          categoryName: category?.name ?? '',
          isActive: product.isActive,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          stock: product.stock,
          createdAt: product.createdAt.toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to index product ${product.id}: ${(error as Error).message}`,
      );
    }
  }

  async removeProduct(productId: string): Promise<void> {
    try {
      await this.elasticsearch.delete({ index: this.index, id: productId });
    } catch (error) {
      this.logger.error(
        `Failed to remove product ${productId} from index: ${(error as Error).message}`,
      );
    }
  }
}
