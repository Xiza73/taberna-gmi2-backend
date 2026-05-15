import { type CashRegister } from '../entities/cash-register.entity';
import { type CashRegisterStatus } from '../enums/cash-register-status.enum';

export const CASH_REGISTER_REPOSITORY = Symbol('CASH_REGISTER_REPOSITORY');

export interface ICashRegisterRepository {
  findById(id: string): Promise<CashRegister | null>;
  findOpenByStaff(staffId: string): Promise<CashRegister | null>;
  findAll(params: {
    page: number;
    limit: number;
    staffId?: string;
    status?: CashRegisterStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ items: CashRegister[]; total: number }>;
  save(entity: CashRegister): Promise<CashRegister>;
}
