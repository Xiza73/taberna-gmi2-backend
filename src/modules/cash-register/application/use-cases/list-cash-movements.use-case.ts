import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  CASH_MOVEMENT_REPOSITORY,
  type ICashMovementRepository,
} from '../../domain/interfaces/cash-movement-repository.interface';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';

import { CashMovementResponseDto } from '../dtos/cash-movement-response.dto';

@Injectable()
export class ListCashMovementsUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
    @Inject(CASH_MOVEMENT_REPOSITORY)
    private readonly cashMovementRepository: ICashMovementRepository,
  ) {}

  async execute(staffId: string): Promise<CashMovementResponseDto[]> {
    const cashRegister =
      await this.cashRegisterRepository.findOpenByStaff(staffId);
    if (!cashRegister) {
      throw new DomainNotFoundException(
        ErrorMessages.POS_CASH_REGISTER_NOT_OPEN,
      );
    }
    const movements = await this.cashMovementRepository.findByCashRegister(
      cashRegister.id,
    );
    return movements.map((m) => new CashMovementResponseDto(m));
  }
}
