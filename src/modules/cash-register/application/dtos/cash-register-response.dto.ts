import { type CashMovement } from '../../domain/entities/cash-movement.entity';
import { type CashRegister } from '../../domain/entities/cash-register.entity';
import { type CashFlowBreakdown } from '../services/cash-flow-calculator';

import { CashMovementResponseDto } from './cash-movement-response.dto';

export class CashRegisterResponseDto {
  id: string;
  staffId: string;
  /**
   * Nombre del staff que abrió la caja. Null cuando el use case no
   * resolvió el lookup (e.g. detalle puntual de una caja).
   * Se rellena vía `extras.staffName` desde el use case.
   */
  staffName: string | null;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  cashSalesAmount: number;
  cashInAmount: number;
  cashOutAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  movements?: CashMovementResponseDto[];

  constructor(
    entity: CashRegister,
    extras?: {
      movements?: CashMovement[];
      breakdown?: CashFlowBreakdown;
      staffName?: string | null;
    },
  ) {
    this.id = entity.id;
    this.staffId = entity.staffId;
    this.staffName = extras?.staffName ?? null;
    this.openedAt = entity.openedAt.toISOString();
    this.closedAt = entity.closedAt ? entity.closedAt.toISOString() : null;
    this.initialAmount = entity.initialAmount;
    this.closingAmount = entity.closingAmount;
    this.expectedAmount = entity.expectedAmount;
    this.difference = entity.difference;
    this.cashSalesAmount = extras?.breakdown?.cashSalesAmount ?? 0;
    this.cashInAmount = extras?.breakdown?.cashInAmount ?? 0;
    this.cashOutAmount = extras?.breakdown?.cashOutAmount ?? 0;
    this.status = entity.status;
    this.notes = entity.notes;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
    if (extras?.movements) {
      this.movements = extras.movements.map((m) => new CashMovementResponseDto(m));
    }
  }
}
