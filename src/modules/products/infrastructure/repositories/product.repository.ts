import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Product } from '../../domain/entities/product.entity.js';
import { type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductOrmEntity } from '../orm-entities/product.orm-entity.js';
import { ProductMapper } from '../mappers/product.mapper.js';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async save(entity: Product): Promise<Product> {
    const orm = ProductMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return ProductMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const orm = await this.repo.findOne({ where: { slug } });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async findAll(params: {
    page: number;
    limit: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    includeInactive?: boolean;
  }): Promise<{ items: Product[]; total: number }> {
    const qb = this.repo.createQueryBuilder('p');

    if (!params.includeInactive) {
      qb.andWhere('p.is_active = true');
    }

    if (params.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: params.categoryId });
    }

    if (params.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: params.minPrice });
    }

    if (params.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: params.maxPrice });
    }

    if (params.search) {
      qb.andWhere('p.name ILIKE :search', { search: `%${params.search}%` });
    }

    switch (params.sortBy) {
      case 'price':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.price', 'DESC');
        break;
      case 'name':
        qb.orderBy('p.name', 'ASC');
        break;
      case 'newest':
        qb.orderBy('p.created_at', 'DESC');
        break;
      case 'rating':
        qb.orderBy('p.average_rating', 'DESC', 'NULLS LAST');
        break;
      default:
        qb.orderBy('p.created_at', 'DESC');
        break;
    }

    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map(ProductMapper.toDomain), total };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo.createQueryBuilder('p').where('p.slug = :slug', { slug });
    if (excludeId) {
      qb.andWhere('p.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo.createQueryBuilder('p').where('p.sku = :sku', { sku });
    if (excludeId) {
      qb.andWhere('p.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(ProductOrmEntity);
    const clone = new ProductRepository(repo) as this;
    return clone;
  }
}
