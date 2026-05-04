import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderChannel } from '../../domain/enums/order-channel.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { CustomerDocType } from '../../domain/enums/customer-doc-type.enum';
import { ShippingMethod } from '../../domain/enums/shipping-method.enum';

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

  @Column({
    type: 'enum',
    enum: OrderChannel,
    default: OrderChannel.ONLINE,
  })
  channel: OrderChannel;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
    default: PaymentMethod.MERCADOPAGO,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
    name: 'shipping_method',
    default: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

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

  @Column({ type: 'jsonb', name: 'shipping_address_snapshot', nullable: true })
  shippingAddressSnapshot: Record<string, unknown> | null;

  @Column({ type: 'varchar', name: 'customer_name' })
  customerName: string;

  @Column({ type: 'varchar', name: 'customer_email' })
  customerEmail: string;

  @Column({ type: 'varchar', name: 'customer_phone', nullable: true })
  customerPhone: string | null;

  @Column({
    type: 'enum',
    enum: CustomerDocType,
    name: 'customer_doc_type',
    nullable: true,
  })
  customerDocType: CustomerDocType | null;

  @Column({
    type: 'varchar',
    length: 11,
    name: 'customer_doc_number',
    nullable: true,
  })
  customerDocNumber: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', name: 'admin_notes', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
