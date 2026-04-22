import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Category } from '../../domain/entities/category.entity';
import { type ICategoryRepository } from '../../domain/interfaces/category-repository.interface';
import { CategoryOrmEntity } from '../orm-entities/category.orm-entity';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async save(entity: Category): Promise<Category> {
    const orm = CategoryMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return CategoryMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Category | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const orm = await this.repo.findOne({ where: { slug } });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findAllActive(): Promise<Category[]> {
    const orms = await this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return orms.map((orm) => CategoryMapper.toDomain(orm));
  }

  async findAll(params: {
    page: number;
    limit: number;
    includeInactive?: boolean;
  }): Promise<{ items: Category[]; total: number }> {
    const qb = this.repo.createQueryBuilder('c');

    if (!params.includeInactive) {
      qb.andWhere('c.is_active = true');
    }

    qb.orderBy('c.sort_order', 'ASC').addOrderBy('c.name', 'ASC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => CategoryMapper.toDomain(orm)), total };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async hasProducts(categoryId: string): Promise<boolean> {
    const result: unknown = await this.repo.manager
      .createQueryBuilder()
      .select('1')
      .from('products', 'p')
      .where('p.category_id = :categoryId', { categoryId })
      .limit(1)
      .getRawOne();
    return !!result;
  }

  async hasSubcategories(categoryId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { parentId: categoryId } });
    return count > 0;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.slug = :slug', { slug });
    if (excludeId) {
      qb.andWhere('c.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(CategoryOrmEntity);
    const clone = new CategoryRepository(repo) as this;
    return clone;
  }
}
