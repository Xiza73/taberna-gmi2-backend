import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';

@Entity('cash_registers')
@Index('idx_cash_registers_staff_id', ['staffId'])
@Index('idx_cash_registers_status', ['status'])
export class CashRegisterOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'staff_id' })
  staffId: string;

  @Column({ type: 'timestamptz', name: 'opened_at' })
  openedAt: Date;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'integer', name: 'initial_amount' })
  initialAmount: number;

  @Column({ type: 'integer', name: 'closing_amount', nullable: true })
  closingAmount: number | null;

  @Column({ type: 'integer', name: 'expected_amount', nullable: true })
  expectedAmount: number | null;

  @Column({ type: 'integer', nullable: true })
  difference: number | null;

  @Column({ type: 'varchar', length: 20 })
  status: CashRegisterStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
