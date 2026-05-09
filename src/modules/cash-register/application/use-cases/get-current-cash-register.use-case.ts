import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';

import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';

@Injectable()
export class GetCurrentCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
  ) {}

  async execute(staffId: string): Promise<CashRegisterResponseDto> {
    const cashRegister =
      await this.cashRegisterRepository.findOpenByStaff(staffId);
    if (!cashRegister) {
      throw new DomainNotFoundException(
        ErrorMessages.POS_CASH_REGISTER_NOT_OPEN,
      );
    }
    return new CashRegisterResponseDto(cashRegister);
  }
}
