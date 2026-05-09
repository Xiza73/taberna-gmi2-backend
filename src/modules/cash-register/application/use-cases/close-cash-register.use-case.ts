import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import { CashMovementType } from '../../domain/enums/cash-movement-type.enum';
import {
  CASH_MOVEMENT_REPOSITORY,
  type ICashMovementRepository,
} from '../../domain/interfaces/cash-movement-repository.interface';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';

import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';
import { type CloseCashRegisterDto } from '../dtos/close-cash-register.dto';

@Injectable()
export class CloseCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
    @Inject(CASH_MOVEMENT_REPOSITORY)
    private readonly cashMovementRepository: ICashMovementRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    staffId: string,
    dto: CloseCashRegisterDto,
  ): Promise<CashRegisterResponseDto> {
    const cashRegister =
      await this.cashRegisterRepository.findOpenByStaff(staffId);
    if (!cashRegister) {
      throw new DomainNotFoundException(
        ErrorMessages.POS_CASH_REGISTER_NOT_OPEN,
      );
    }

    const now = new Date();
    const cashSales = await this.orderRepository.sumCashSalesByStaffBetween(
      staffId,
      cashRegister.openedAt,
      now,
    );

    const movements = await this.cashMovementRepository.findByCashRegister(
      cashRegister.id,
    );
    const cashIn = movements
      .filter((m) => m.type === CashMovementType.CASH_IN)
      .reduce((sum, m) => sum + m.amount, 0);
    const cashOut = movements
      .filter((m) => m.type === CashMovementType.CASH_OUT)
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedAmount =
      cashRegister.initialAmount + cashSales + cashIn - cashOut;
    const difference = dto.closingAmount - expectedAmount;

    cashRegister.close({
      closingAmount: dto.closingAmount,
      expectedAmount,
      difference,
      notes: dto.notes ?? null,
    });

    const saved = await this.cashRegisterRepository.save(cashRegister);
    return new CashRegisterResponseDto(saved);
  }
}
