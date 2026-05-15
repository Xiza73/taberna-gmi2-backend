import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '@modules/staff/domain/interfaces/staff-member-repository.interface';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';
import { type AdminOrderQueryDto } from '../dtos/order-query.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class AdminListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(
    query: AdminOrderQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.orderRepository.findAll({
      page,
      limit,
      status: query.status,
      userId: query.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      sortBy: query.sortBy,
    });

    // Batch lookup de nombres de staff para órdenes POS/WhatsApp.
    // Evita N+1: una sola query con WHERE id IN (...) por todos los
    // staffIds únicos de la página actual.
    const staffIds = Array.from(
      new Set(
        items
          .map((o) => o.staffId)
          .filter((id): id is string => id !== null),
      ),
    );
    const staffMembers = await this.staffRepository.findByIds(staffIds);
    const staffNameById = new Map<string, string>(
      staffMembers.map((s) => [s.id, s.name]),
    );

    return new PaginatedResponseDto(
      items.map(
        (o) =>
          new OrderResponseDto(o, {
            staffName: o.staffId ? staffNameById.get(o.staffId) ?? null : null,
          }),
      ),
      total,
      page,
      limit,
    );
  }
}
