import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderOrmEntity } from './order.orm-entity';

@Entity('order_items')
@Index('idx_order_items_order_id', ['orderId'])
export class OrderItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', name: 'product_name' })
  productName: string;

  @Column({ type: 'varchar', name: 'product_slug' })
  productSlug: string;

  @Column({ type: 'varchar', name: 'product_image', nullable: true })
  productImage: string | null;

  @Column({ type: 'integer', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer' })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => OrderOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;
}
