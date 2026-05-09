import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';

@Entity('cash_movements')
@Index('idx_cash_movements_cash_register_id', ['cashRegisterId'])
export class CashMovementOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'cash_register_id' })
  cashRegisterId: string;

  @Column({ type: 'uuid', name: 'staff_id' })
  staffId: string;

  @Column({ type: 'varchar', length: 20 })
  type: CashMovementType;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
