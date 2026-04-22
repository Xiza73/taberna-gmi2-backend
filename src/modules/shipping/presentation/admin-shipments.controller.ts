import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { CreateShipmentUseCase } from '../application/use-cases/create-shipment.use-case';
import { UpdateShipmentUseCase } from '../application/use-cases/update-shipment.use-case';
import { CreateShipmentDto } from '../application/dtos/create-shipment.dto';
import { UpdateShipmentDto } from '../application/dtos/update-shipment.dto';

@Controller('admin/orders')
@RequireSubjectType(SubjectType.STAFF)
export class AdminShipmentsController {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly updateShipmentUseCase: UpdateShipmentUseCase,
  ) {}

  @Post(':id/shipment')
  async create(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    const result = await this.createShipmentUseCase.execute(orderId, dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id/shipment')
  async update(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    const result = await this.updateShipmentUseCase.execute(orderId, dto);
    return BaseResponse.ok(result);
  }
}
