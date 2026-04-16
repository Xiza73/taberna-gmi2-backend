import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto.js';

import { ORDER_REPOSITORY, type IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';
import { type OrderQueryDto } from '../dtos/order-query.dto.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class ListMyOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: string, query: OrderQueryDto): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.orderRepository.findAllByUserId({
      userId,
      page,
      limit,
      status: query.status,
    });

    return new PaginatedResponseDto(
      items.map((o) => new OrderResponseDto(o)),
      total,
      page,
      limit,
    );
  }
}
