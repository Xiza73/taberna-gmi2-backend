import { Inject, Injectable } from '@nestjs/common';

import { DomainConflictException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashRegister } from '../../domain/entities/cash-register.entity';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';

import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';
import { type OpenCashRegisterDto } from '../dtos/open-cash-register.dto';

@Injectable()
export class OpenCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
  ) {}

  async execute(
    staffId: string,
    dto: OpenCashRegisterDto,
  ): Promise<CashRegisterResponseDto> {
    const existing = await this.cashRegisterRepository.findOpenByStaff(staffId);
    if (existing) {
      throw new DomainConflictException(
        ErrorMessages.POS_CASH_REGISTER_ALREADY_OPEN,
      );
    }

    const cashRegister = CashRegister.create({
      staffId,
      initialAmount: dto.initialAmount,
    });
    const saved = await this.cashRegisterRepository.save(cashRegister);
    return new CashRegisterResponseDto(saved);
  }
}
