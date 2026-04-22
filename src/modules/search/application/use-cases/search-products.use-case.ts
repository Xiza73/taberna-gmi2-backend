import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';

import {
  PRODUCT_SEARCH,
  type IProductSearchService,
  type ProductSearchResult,
} from '../../domain/interfaces/product-search.interface';
import { type SearchQueryDto } from '../dtos/search-query.dto';

@Injectable()
export class SearchProductsUseCase {
  private readonly logger = new Logger(SearchProductsUseCase.name);

  constructor(
    @Inject(PRODUCT_SEARCH)
    private readonly searchService: IProductSearchService,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    dto: SearchQueryDto,
  ): Promise<{ items: ProductSearchResult[]; total: number }> {
    try {
      return await this.searchService.search({
        query: dto.q,
        categoryId: dto.categoryId,
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
        sortBy: dto.sortBy,
        page: dto.page ?? 1,
        limit: dto.limit ?? 10,
      });
    } catch (error) {
      this.logger.warn(
        `Elasticsearch unavailable, falling back to PostgreSQL: ${(error as Error).message}`,
      );
      return this.fallbackSearch(dto);
    }
  }

  private async fallbackSearch(
    dto: SearchQueryDto,
  ): Promise<{ items: ProductSearchResult[]; total: number }> {
    const result = await this.productRepository.findAll({
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
      search: dto.q,
      categoryId: dto.categoryId,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      sortBy: dto.sortBy,
    });

    const items: ProductSearchResult[] = result.items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      images: p.images,
      categoryName: '',
      averageRating: p.averageRating,
      stock: p.stock,
    }));

    return { items, total: result.total };
  }
}
