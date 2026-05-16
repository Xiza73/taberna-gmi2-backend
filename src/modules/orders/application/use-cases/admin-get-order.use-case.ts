import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '@modules/staff/domain/interfaces/staff-member-repository.interface';

import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class AdminGetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(orderId: string): Promise<OrderResponseDto> {
    const result = await this.orderRepository.findByIdWithDetails(orderId);
    if (!result) {
      throw new DomainNotFoundException(ErrorMessages.ORDER_NOT_FOUND);
    }
    // Resolver staffName si la orden es POS/WhatsApp (staffId no nulo).
    let staffName: string | null = null;
    if (result.order.staffId) {
      const staff = await this.staffRepository.findById(result.order.staffId);
      staffName = staff?.name ?? null;
    }
    return new OrderResponseDto(result.order, {
      items: result.items,
      events: result.events,
      staffName,
    });
  }
}
