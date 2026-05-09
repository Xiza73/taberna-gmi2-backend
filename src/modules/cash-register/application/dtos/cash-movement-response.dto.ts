import { type CashMovement } from '../../domain/entities/cash-movement.entity';

export class CashMovementResponseDto {
  id: string;
  cashRegisterId: string;
  staffId: string;
  type: string;
  amount: number;
  reason: string;
  createdAt: string;

  constructor(entity: CashMovement) {
    this.id = entity.id;
    this.cashRegisterId = entity.cashRegisterId;
    this.staffId = entity.staffId;
    this.type = entity.type;
    this.amount = entity.amount;
    this.reason = entity.reason;
    this.createdAt = entity.createdAt.toISOString();
  }
}
