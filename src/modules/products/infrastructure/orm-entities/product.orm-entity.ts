import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CategoryOrmEntity } from '@modules/categories/infrastructure/orm-entities/category.orm-entity.js';

@Entity('products')
@Index('idx_products_category_id', ['categoryId'])
@Index('idx_products_slug', ['slug'], { unique: true })
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'integer', name: 'compare_at_price', nullable: true })
  compareAtPrice: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  sku: string | null;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Column({ type: 'jsonb', default: '[]' })
  images: string[];

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => CategoryOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryOrmEntity;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'decimal',
    name: 'average_rating',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  averageRating: number | null;

  @Column({ type: 'integer', name: 'total_reviews', default: 0 })
  totalReviews: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
