import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';

import { GetShipmentUseCase } from '../application/use-cases/get-shipment.use-case.js';

@Controller('orders')
export class ShipmentsController {
  constructor(private readonly getShipmentUseCase: GetShipmentUseCase) {}

  @Get(':id/shipment')
  async get(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    const result = await this.getShipmentUseCase.execute(userId, orderId);
    return BaseResponse.ok(result);
  }
}
