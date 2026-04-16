import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Product } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository extends IBaseRepository<Product> {
  findBySlug(slug: string): Promise<Product | null>;
  findAll(params: {
    page: number;
    limit: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    includeInactive?: boolean;
  }): Promise<{ items: Product[]; total: number }>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  skuExists(sku: string, excludeId?: string): Promise<boolean>;
}
