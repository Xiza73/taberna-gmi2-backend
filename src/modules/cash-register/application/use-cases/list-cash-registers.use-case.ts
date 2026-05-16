import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '@modules/staff/domain/interfaces/staff-member-repository.interface';

import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/interfaces/cash-register-repository.interface';
import { type CashRegisterFiltersDto } from '../dtos/cash-register-filters.dto';
import { CashRegisterResponseDto } from '../dtos/cash-register-response.dto';

@Injectable()
export class ListCashRegistersUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRegisterRepository: ICashRegisterRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(
    filters: CashRegisterFiltersDto,
  ): Promise<PaginatedResponseDto<CashRegisterResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const { items, total } = await this.cashRegisterRepository.findAll({
      page,
      limit,
      staffId: filters.staffId,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });

    // Batch lookup de nombres de staff para evitar N+1: una sola query
    // con WHERE id IN (...) por todos los staffIds únicos de la página.
    const staffIds = Array.from(new Set(items.map((cr) => cr.staffId)));
    const staffMembers = await this.staffRepository.findByIds(staffIds);
    const staffNameById = new Map<string, string>(
      staffMembers.map((s) => [s.id, s.name]),
    );

    return new PaginatedResponseDto(
      items.map(
        (cr) =>
          new CashRegisterResponseDto(cr, {
            staffName: staffNameById.get(cr.staffId) ?? null,
          }),
      ),
      total,
      page,
      limit,
    );
  }
}
