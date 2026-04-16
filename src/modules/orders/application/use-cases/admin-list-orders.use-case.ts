import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto.js';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface.js';
import { type AdminOrderQueryDto } from '../dtos/order-query.dto.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class AdminListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
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

    return new PaginatedResponseDto(
      items.map((o) => new OrderResponseDto(o)),
      total,
      page,
      limit,
    );
  }
}
