import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { CreateShipmentUseCase } from '../application/use-cases/create-shipment.use-case.js';
import { UpdateShipmentUseCase } from '../application/use-cases/update-shipment.use-case.js';
import { CreateShipmentDto } from '../application/dtos/create-shipment.dto.js';
import { UpdateShipmentDto } from '../application/dtos/update-shipment.dto.js';

@Controller('admin/orders')
@Roles('admin')
export class AdminShipmentsController {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly updateShipmentUseCase: UpdateShipmentUseCase,
  ) {}

  @Post(':id/shipment')
  async create(@Param('id', ParseUUIDPipe) orderId: string, @Body() dto: CreateShipmentDto) {
    const result = await this.createShipmentUseCase.execute(orderId, dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id/shipment')
  async update(@Param('id', ParseUUIDPipe) orderId: string, @Body() dto: UpdateShipmentDto) {
    const result = await this.updateShipmentUseCase.execute(orderId, dto);
    return BaseResponse.ok(result);
  }
}
