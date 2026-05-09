import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';

import { CreatePosOrderUseCase } from '../application/use-cases/create-pos-order.use-case';
import { ListPosOrdersUseCase } from '../application/use-cases/list-pos-orders.use-case';
import { GetPosOrderUseCase } from '../application/use-cases/get-pos-order.use-case';
import { CancelPosOrderUseCase } from '../application/use-cases/cancel-pos-order.use-case';
import { RefundPosOrderUseCase } from '../application/use-cases/refund-pos-order.use-case';
import { CreatePosOrderDto } from '../application/dtos/create-pos-order.dto';
import { PosOrderFiltersDto } from '../application/dtos/pos-order-filters.dto';
import { CancelPosOrderDto } from '../application/dtos/cancel-pos-order.dto';
import { RefundPosOrderDto } from '../application/dtos/refund-pos-order.dto';

interface AuthenticatedStaff {
  id: string;
  name: string;
}

@Controller('admin/pos/orders')
@RequireSubjectType(SubjectType.STAFF)
@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
export class AdminPosOrdersController {
  constructor(
    private readonly createPosOrderUseCase: CreatePosOrderUseCase,
    private readonly listPosOrdersUseCase: ListPosOrdersUseCase,
    private readonly getPosOrderUseCase: GetPosOrderUseCase,
    private readonly cancelPosOrderUseCase: CancelPosOrderUseCase,
    private readonly refundPosOrderUseCase: RefundPosOrderUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() staff: AuthenticatedStaff,
    @Body() dto: CreatePosOrderDto,
  ) {
    const result = await this.createPosOrderUseCase.execute(
      { id: staff.id, name: staff.name },
      dto,
    );
    return BaseResponse.ok(result, 'Venta POS registrada');
  }

  @Get()
  async list(@Query() filters: PosOrderFiltersDto) {
    const result = await this.listPosOrdersUseCase.execute(filters);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getPosOrderUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() staff: AuthenticatedStaff,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPosOrderDto,
  ) {
    await this.cancelPosOrderUseCase.execute(
      { id: staff.id, name: staff.name },
      id,
      dto,
    );
    return BaseResponse.ok(null, 'Venta anulada');
  }

  @Post(':id/refund')
  @RequireStaffRole(StaffRole.SUPER_ADMIN)
  async refund(
    @CurrentUser() staff: AuthenticatedStaff,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPosOrderDto,
  ) {
    await this.refundPosOrderUseCase.execute(
      { id: staff.id, name: staff.name },
      id,
      dto,
    );
    return BaseResponse.ok(null, 'Devolución registrada');
  }
}
