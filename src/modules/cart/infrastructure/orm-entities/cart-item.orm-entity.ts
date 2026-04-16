import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';

import { ProductOrmEntity } from '@modules/products/infrastructure/orm-entities/product.orm-entity.js';

import { CartOrmEntity } from './cart.orm-entity.js';

@Entity('cart_items')
@Unique('uq_cart_items_cart_product', ['cartId', 'productId'])
@Index('idx_cart_items_cart_id', ['cartId'])
export class CartItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'cart_id' })
  cartId: string;

  @ManyToOne(() => CartOrmEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart?: CartOrmEntity;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @Column({ type: 'integer' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
