import { type CashMovement } from '../../domain/entities/cash-movement.entity';
import { type CashRegister } from '../../domain/entities/cash-register.entity';

import { CashMovementResponseDto } from './cash-movement-response.dto';

export class CashRegisterResponseDto {
  id: string;
  staffId: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  movements?: CashMovementResponseDto[];

  constructor(entity: CashRegister, extras?: { movements?: CashMovement[] }) {
    this.id = entity.id;
    this.staffId = entity.staffId;
    this.openedAt = entity.openedAt.toISOString();
    this.closedAt = entity.closedAt ? entity.closedAt.toISOString() : null;
    this.initialAmount = entity.initialAmount;
    this.closingAmount = entity.closingAmount;
    this.expectedAmount = entity.expectedAmount;
    this.difference = entity.difference;
    this.status = entity.status;
    this.notes = entity.notes;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
    if (extras?.movements) {
      this.movements = extras.movements.map((m) => new CashMovementResponseDto(m));
    }
  }
}
