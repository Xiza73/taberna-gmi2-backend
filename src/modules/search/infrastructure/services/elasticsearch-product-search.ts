import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import { type IProductSearchService, type ProductSearchResult } from '../../domain/interfaces/product-search.interface.js';

@Injectable()
export class ElasticsearchProductSearch implements IProductSearchService {
  private readonly logger = new Logger(ElasticsearchProductSearch.name);
  private readonly index = 'products';

  constructor(private readonly elasticsearch: ElasticsearchService) {}

  async search(params: {
    query: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ProductSearchResult[]; total: number }> {
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [
      { term: { isActive: true } },
      { range: { stock: { gt: 0 } } },
    ];

    if (params.query) {
      must.push({
        multi_match: {
          query: params.query,
          fields: ['name^3', 'description'],
          fuzziness: 'AUTO',
          type: 'best_fields',
        },
      });
    }

    if (params.categoryId) {
      filter.push({ term: { categoryId: params.categoryId } });
    }

    if (params.minPrice !== undefined) {
      filter.push({ range: { price: { gte: params.minPrice } } });
    }

    if (params.maxPrice !== undefined) {
      filter.push({ range: { price: { lte: params.maxPrice } } });
    }

    const sort: Array<string | Record<string, unknown>> = [];
    switch (params.sortBy) {
      case 'price':
        sort.push({ price: 'asc' });
        break;
      case 'price_desc':
        sort.push({ price: 'desc' });
        break;
      case 'rating':
        sort.push({ averageRating: { order: 'desc', missing: '_last' } });
        break;
      case 'newest':
        sort.push({ createdAt: 'desc' });
        break;
      default:
        if (params.query) {
          sort.push('_score');
        } else {
          sort.push({ createdAt: 'desc' });
        }
        break;
    }

    try {
      const result = await this.elasticsearch.search({
        index: this.index,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: sort as never,
        from: (params.page - 1) * params.limit,
        size: params.limit,
      });

      const hits = result.hits.hits;
      const total = typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total as { value: number }).value;

      const items: ProductSearchResult[] = hits.map((hit) => {
        const src = hit._source as Record<string, unknown>;
        return {
          id: src['id'] as string,
          name: src['name'] as string,
          slug: src['slug'] as string,
          description: src['description'] as string,
          price: src['price'] as number,
          images: src['images'] as string[],
          categoryName: src['categoryName'] as string,
          averageRating: src['averageRating'] as number | null,
          stock: src['stock'] as number,
        };
      });

      return { items, total };
    } catch (error) {
      this.logger.error(`Elasticsearch search failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async suggest(query: string, limit: number): Promise<string[]> {
    try {
      const result = await this.elasticsearch.search({
        index: this.index,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  type: 'bool_prefix',
                  fields: ['name.suggest', 'name.suggest._2gram', 'name.suggest._3gram'],
                },
              },
            ],
            filter: [
              { term: { isActive: true } },
              { range: { stock: { gt: 0 } } },
            ],
          },
        },
        _source: ['name'],
        size: limit,
      });

      const hits = result.hits.hits;
      return hits.map((hit) => (hit._source as { name: string }).name);
    } catch (error) {
      this.logger.error(`Elasticsearch suggest failed: ${(error as Error).message}`);
      return [];
    }
  }
}
