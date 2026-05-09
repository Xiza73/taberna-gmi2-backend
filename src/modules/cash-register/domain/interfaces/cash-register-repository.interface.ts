import { type CashRegister } from '../entities/cash-register.entity';

export const CASH_REGISTER_REPOSITORY = Symbol('CASH_REGISTER_REPOSITORY');

export interface ICashRegisterRepository {
  findById(id: string): Promise<CashRegister | null>;
  findOpenByStaff(staffId: string): Promise<CashRegister | null>;
  save(entity: CashRegister): Promise<CashRegister>;
}
