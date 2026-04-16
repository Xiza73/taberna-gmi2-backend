import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';

import { CreateOrderUseCase } from '../application/use-cases/create-order.use-case.js';
import { ListMyOrdersUseCase } from '../application/use-cases/list-my-orders.use-case.js';
import { GetOrderUseCase } from '../application/use-cases/get-order.use-case.js';
import { CancelOrderUseCase } from '../application/use-cases/cancel-order.use-case.js';
import { RetryPaymentUseCase } from '../application/use-cases/retry-payment.use-case.js';
import { VerifyPaymentUseCase } from '../application/use-cases/verify-payment.use-case.js';
import { CreateOrderDto } from '../application/dtos/create-order.dto.js';
import { OrderQueryDto } from '../application/dtos/order-query.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listMyOrdersUseCase: ListMyOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly retryPaymentUseCase: RetryPaymentUseCase,
    private readonly verifyPaymentUseCase: VerifyPaymentUseCase,
  ) {}

  @Post()
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    const result = await this.createOrderUseCase.execute(userId, dto);
    return BaseResponse.ok(result);
  }

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: OrderQueryDto) {
    const result = await this.listMyOrdersUseCase.execute(userId, query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getOrderUseCase.execute(userId, id);
    return BaseResponse.ok(result);
  }

  @Post(':id/cancel')
  async cancel(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.cancelOrderUseCase.execute(userId, id);
    return BaseResponse.ok(null, 'Order cancelled successfully');
  }

  @Post(':id/retry-payment')
  async retryPayment(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.retryPaymentUseCase.execute(userId, id);
    return BaseResponse.ok(result);
  }

  @Post(':id/verify-payment')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async verifyPayment(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.verifyPaymentUseCase.execute(userId, id);
    return BaseResponse.ok(result);
  }
}
