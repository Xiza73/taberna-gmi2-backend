import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Carrier } from '../../domain/enums/carrier.enum.js';
import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';

@Entity('shipments')
@Index('idx_shipments_order_id', ['orderId'], { unique: true })
export class ShipmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id', unique: true })
  orderId: string;

  @Column({ type: 'enum', enum: Carrier })
  carrier: Carrier;

  @Column({ type: 'varchar', name: 'tracking_number' })
  trackingNumber: string;

  @Column({ type: 'varchar', name: 'tracking_url' })
  trackingUrl: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.SHIPPED })
  status: ShipmentStatus;

  @Column({ type: 'timestamptz', name: 'shipped_at', nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'delivered_at', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
