import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';

import {
  CASH_MOVEMENT_REPOSITORY,
  type ICashMovementRepository,
} from '../../domain/interfaces/cash-movement-repository.interface';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';

import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';
import { computeCashFlowBreakdown } from '../services/cash-flow-calculator';

@Injectable()
export class GetCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
    @Inject(CASH_MOVEMENT_REPOSITORY)
    private readonly cashMovementRepository: ICashMovementRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string): Promise<CashRegisterResponseDto> {
    const cashRegister = await this.cashRegisterRepository.findById(id);
    if (!cashRegister) {
      throw new DomainNotFoundException(
        ErrorMessages.POS_CASH_REGISTER_NOT_FOUND,
      );
    }
    const movements = await this.cashMovementRepository.findByCashRegister(id);
    const breakdown = await computeCashFlowBreakdown(
      cashRegister,
      movements,
      this.orderRepository,
    );
    return new CashRegisterResponseDto(cashRegister, { movements, breakdown });
  }
}
