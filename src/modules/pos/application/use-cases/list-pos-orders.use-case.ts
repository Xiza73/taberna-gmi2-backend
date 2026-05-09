import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

import { type PosOrderFiltersDto } from '../dtos/pos-order-filters.dto';

@Injectable()
export class ListPosOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    filters: PosOrderFiltersDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    // Si no se pasa channel, devolvemos POS + WhatsApp (excluye ONLINE).
    const channelIn = filters.channel
      ? undefined
      : [OrderChannel.POS, OrderChannel.WHATSAPP];

    const sortBy = filters.sortBy === 'createdAt' ? undefined : filters.sortBy;

    const { items, total } = await this.orderRepository.findAll({
      page,
      limit,
      channel: filters.channel,
      channelIn,
      paymentMethod: filters.paymentMethod,
      staffId: filters.staffId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
      sortBy,
    });

    return new PaginatedResponseDto(
      items.map((o) => new OrderResponseDto(o)),
      total,
      page,
      limit,
    );
  }
}
