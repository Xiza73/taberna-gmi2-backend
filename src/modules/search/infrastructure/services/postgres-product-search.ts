import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  type IProductSearchService,
  type ProductSearchResult,
} from '../../domain/interfaces/product-search.interface';

// Umbral de similitud trigram (pg_trgm) para tolerar typos. 0.2 perdona un
// poco más que el default 0.3 sin colar demasiados falsos positivos.
const SIMILARITY_THRESHOLD = 0.2;

interface SearchRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[] | null;
  categoryName: string;
  averageRating: string | null;
  stock: number;
  totalCount: string;
}

interface SuggestRow {
  name: string;
}

@Injectable()
export class PostgresProductSearch implements IProductSearchService {
  private readonly logger = new Logger(PostgresProductSearch.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async search(params: {
    query: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ProductSearchResult[]; total: number }> {
    const query = (params.query ?? '').trim();
    const values: unknown[] = [];
    const conditions: string[] = ['p.is_active = true', 'p.stock > 0'];

    // $1 siempre es el texto de búsqueda (aunque esté vacío) para poder
    // referenciarlo en el ranking sin recomputar índices de parámetros.
    values.push(query);
    const qParam = '$1';

    if (params.categoryId) {
      values.push(params.categoryId);
      conditions.push(`p.category_id = $${values.length}`);
    }
    if (params.minPrice !== undefined) {
      values.push(params.minPrice);
      conditions.push(`p.price >= $${values.length}`);
    }
    if (params.maxPrice !== undefined) {
      values.push(params.maxPrice);
      conditions.push(`p.price <= $${values.length}`);
    }

    if (query !== '') {
      // Match por full-text (incluye name + synonyms + description vía
      // search_vector) O por similitud trigram del nombre (typos).
      conditions.push(
        `(p.search_vector @@ websearch_to_tsquery('spanish', ${qParam}) ` +
          `OR similarity(p.name, ${qParam}) > ${SIMILARITY_THRESHOLD})`,
      );
    }

    const orderBy = this.buildOrderBy(params.sortBy, query, qParam);

    values.push(params.limit);
    const limitParam = `$${values.length}`;
    values.push((params.page - 1) * params.limit);
    const offsetParam = `$${values.length}`;

    const sql = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.images,
        c.name AS "categoryName",
        p.average_rating AS "averageRating",
        p.stock,
        count(*) OVER() AS "totalCount"
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    try {
      const rows = await this.dataSource.query<SearchRow[]>(sql, values);
      const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;
      const items: ProductSearchResult[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: row.price,
        images: row.images ?? [],
        categoryName: row.categoryName ?? '',
        averageRating:
          row.averageRating !== null ? Number(row.averageRating) : null,
        stock: row.stock,
      }));
      return { items, total };
    } catch (error) {
      this.logger.error(`Postgres search failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async suggest(query: string, limit: number): Promise<string[]> {
    const trimmed = (query ?? '').trim();
    if (trimmed === '') {
      return [];
    }

    const sql = `
      SELECT p.name
      FROM products p
      WHERE p.is_active = true
        AND p.stock > 0
        AND (p.name ILIKE $1 || '%' OR similarity(p.name, $1) > ${SIMILARITY_THRESHOLD})
      GROUP BY p.name
      ORDER BY max(similarity(p.name, $1)) DESC
      LIMIT $2
    `;

    try {
      const rows = await this.dataSource.query<SuggestRow[]>(sql, [
        trimmed,
        limit,
      ]);
      return rows.map((row) => row.name);
    } catch (error) {
      this.logger.error(`Postgres suggest failed: ${(error as Error).message}`);
      return [];
    }
  }

  private buildOrderBy(
    sortBy: string | undefined,
    query: string,
    qParam: string,
  ): string {
    switch (sortBy) {
      case 'price':
        return 'p.price ASC';
      case 'price_desc':
        return 'p.price DESC';
      case 'rating':
        return 'p.average_rating DESC NULLS LAST, p.created_at DESC';
      case 'newest':
        return 'p.created_at DESC';
      default:
        if (query !== '') {
          // Relevancia: ranking full-text primero, luego similitud del
          // nombre (para que los typos también ordenen de forma sensata).
          return (
            `ts_rank(p.search_vector, websearch_to_tsquery('spanish', ${qParam})) DESC, ` +
            `similarity(p.name, ${qParam}) DESC, p.created_at DESC`
          );
        }
        return 'p.created_at DESC';
    }
  }
}
