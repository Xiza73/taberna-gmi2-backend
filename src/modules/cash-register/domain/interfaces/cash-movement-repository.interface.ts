import { type CashMovement } from '../entities/cash-movement.entity';

export const CASH_MOVEMENT_REPOSITORY = Symbol('CASH_MOVEMENT_REPOSITORY');

export interface ICashMovementRepository {
  findByCashRegister(cashRegisterId: string): Promise<CashMovement[]>;
  save(entity: CashMovement): Promise<CashMovement>;
}
