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

import { CustomerOrmEntity } from '@modules/customers/infrastructure/orm-entities/customer.orm-entity';
import { ProductOrmEntity } from '@modules/products/infrastructure/orm-entities/product.orm-entity';

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

  @ManyToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  customer?: CustomerOrmEntity;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
