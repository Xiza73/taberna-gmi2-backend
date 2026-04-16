import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Category } from '../entities/category.entity.js';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository extends IBaseRepository<Category> {
  findBySlug(slug: string): Promise<Category | null>;
  findAllActive(): Promise<Category[]>;
  findAll(params: { page: number; limit: number; includeInactive?: boolean }): Promise<{ items: Category[]; total: number }>;
  hasProducts(categoryId: string): Promise<boolean>;
  hasSubcategories(categoryId: string): Promise<boolean>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
