import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderStatus } from '../../domain/enums/order-status.enum.js';

@Entity('orders')
@Index('idx_orders_user_id', ['userId'])
@Index('idx_orders_user_coupon', ['userId', 'couponId'], {
  where: 'coupon_id IS NOT NULL',
})
@Index('idx_orders_pending_created', ['createdAt'], {
  where: "status = 'pending'",
})
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'integer' })
  subtotal: number;

  @Column({ type: 'integer', default: 0 })
  discount: number;

  @Column({ type: 'integer', name: 'shipping_cost', default: 0 })
  shippingCost: number;

  @Column({ type: 'integer' })
  total: number;

  @Column({ type: 'uuid', name: 'coupon_id', nullable: true })
  couponId: string | null;

  @Column({ type: 'varchar', name: 'coupon_code', nullable: true })
  couponCode: string | null;

  @Column({ type: 'integer', name: 'coupon_discount', nullable: true })
  couponDiscount: number | null;

  @Column({ type: 'jsonb', name: 'shipping_address_snapshot' })
  shippingAddressSnapshot: Record<string, unknown>;

  @Column({ type: 'varchar', name: 'customer_name' })
  customerName: string;

  @Column({ type: 'varchar', name: 'customer_email' })
  customerEmail: string;

  @Column({ type: 'varchar', name: 'customer_phone', nullable: true })
  customerPhone: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', name: 'admin_notes', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
