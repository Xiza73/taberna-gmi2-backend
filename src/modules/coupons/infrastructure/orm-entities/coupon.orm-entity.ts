import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { CouponType } from '../../domain/enums/coupon-type.enum.js';

@Entity('coupons')
@Index('idx_coupons_code', ['code'], { unique: true })
export class CouponOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'integer' })
  value: number;

  @Column({ type: 'integer', name: 'min_purchase', nullable: true })
  minPurchase: number | null;

  @Column({ type: 'integer', name: 'max_discount', nullable: true })
  maxDiscount: number | null;

  @Column({ type: 'integer', name: 'max_uses', nullable: true })
  maxUses: number | null;

  @Column({ type: 'integer', name: 'max_uses_per_user', nullable: true, default: 1 })
  maxUsesPerUser: number | null;

  @Column({ type: 'integer', name: 'current_uses', default: 0 })
  currentUses: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamptz', name: 'end_date' })
  endDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
