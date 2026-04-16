import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from '../../domain/enums/payment-status.enum.js';

@Entity('payments')
@Index('idx_payments_order_id', ['orderId'])
@Index('idx_payments_external_id', ['externalId'], {
  unique: true,
  where: 'external_id IS NOT NULL',
})
export class PaymentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', name: 'external_id', nullable: true })
  externalId: string | null;

  @Column({ type: 'varchar', name: 'preference_id', nullable: true })
  preferenceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  method: string | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'jsonb', name: 'raw_response', nullable: true })
  rawResponse: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
