import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';

import { AdminListOrdersUseCase } from '../application/use-cases/admin-list-orders.use-case';
import { AdminGetOrderUseCase } from '../application/use-cases/admin-get-order.use-case';
import { UpdateOrderStatusUseCase } from '../application/use-cases/update-order-status.use-case';
import { UpdateOrderNotesUseCase } from '../application/use-cases/update-order-notes.use-case';
import { AdminOrderQueryDto } from '../application/dtos/order-query.dto';
import { UpdateOrderStatusDto } from '../application/dtos/update-order-status.dto';
import { UpdateOrderNotesDto } from '../application/dtos/update-order-notes.dto';

@Controller('admin/orders')
@RequireSubjectType(SubjectType.STAFF)
export class AdminOrdersController {
  constructor(
    private readonly adminListOrdersUseCase: AdminListOrdersUseCase,
    private readonly adminGetOrderUseCase: AdminGetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly updateOrderNotesUseCase: UpdateOrderNotesUseCase,
  ) {}

  @Get()
  async list(@Query() query: AdminOrderQueryDto) {
    const result = await this.adminListOrdersUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminGetOrderUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const result = await this.updateOrderStatusUseCase.execute(
      id,
      adminId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Patch(':id/notes')
  async updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderNotesDto,
  ) {
    const result = await this.updateOrderNotesUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }
}
