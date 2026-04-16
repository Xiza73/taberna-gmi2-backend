import { IsEnum } from 'class-validator';

import { OrderStatus } from '../../domain/enums/order-status.enum.js';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
