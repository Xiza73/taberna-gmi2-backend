import { type IOrderRepository } from '@modules/orders/domain/interfaces/order-repository.interface';

import { type CashMovement } from '../../domain/entities/cash-movement.entity';
import { type CashRegister } from '../../domain/entities/cash-register.entity';
import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';

export interface CashFlowBreakdown {
  cashSalesAmount: number;
  cashInAmount: number;
  cashOutAmount: number;
}

export async function computeCashFlowBreakdown(
  cashRegister: CashRegister,
  movements: CashMovement[],
  orderRepository: IOrderRepository,
): Promise<CashFlowBreakdown> {
  const from = cashRegister.openedAt;
  const to =
    cashRegister.status === CashRegisterStatus.CLOSED && cashRegister.closedAt
      ? cashRegister.closedAt
      : new Date();

  const cashSalesAmount = await orderRepository.sumCashSalesByStaffBetween(
    cashRegister.staffId,
    from,
    to,
  );

  let cashInAmount = 0;
  let cashOutAmount = 0;
  for (const m of movements) {
    if (m.type === CashMovementType.CASH_IN) {
      cashInAmount += m.amount;
    } else if (m.type === CashMovementType.CASH_OUT) {
      cashOutAmount += m.amount;
    }
  }

  return { cashSalesAmount, cashInAmount, cashOutAmount };
}
