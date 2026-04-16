import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserOrmEntity } from '@modules/users/infrastructure/orm-entities/user.orm-entity.js';
import { ProductOrmEntity } from '@modules/products/infrastructure/orm-entities/product.orm-entity.js';

@Entity('wishlist_items')
@Unique('uq_wishlist_user_product', ['userId', 'productId'])
@Index('idx_wishlist_items_user_id', ['userId'])
export class WishlistItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
