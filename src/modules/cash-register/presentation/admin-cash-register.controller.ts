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
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { CloseCashRegisterUseCase } from '../application/use-cases/close-cash-register.use-case';
import { CreateCashMovementUseCase } from '../application/use-cases/create-cash-movement.use-case';
import { GetCashRegisterUseCase } from '../application/use-cases/get-cash-register.use-case';
import { GetCurrentCashRegisterUseCase } from '../application/use-cases/get-current-cash-register.use-case';
import { ListCashMovementsUseCase } from '../application/use-cases/list-cash-movements.use-case';
import { ListCashRegistersUseCase } from '../application/use-cases/list-cash-registers.use-case';
import { OpenCashRegisterUseCase } from '../application/use-cases/open-cash-register.use-case';
import { CashRegisterFiltersDto } from '../application/dtos/cash-register-filters.dto';
import { CloseCashRegisterDto } from '../application/dtos/close-cash-register.dto';
import { CreateCashMovementDto } from '../application/dtos/create-cash-movement.dto';
import { OpenCashRegisterDto } from '../application/dtos/open-cash-register.dto';

interface AuthenticatedStaff {
  id: string;
  name: string;
}

@Controller('admin/pos/cash-register')
@RequireSubjectType(SubjectType.STAFF)
@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
export class AdminCashRegisterController {
  constructor(
    private readonly openCashRegisterUseCase: OpenCashRegisterUseCase,
    private readonly closeCashRegisterUseCase: CloseCashRegisterUseCase,
    private readonly getCurrentCashRegisterUseCase: GetCurrentCashRegisterUseCase,
    private readonly getCashRegisterUseCase: GetCashRegisterUseCase,
    private readonly listCashRegistersUseCase: ListCashRegistersUseCase,
    private readonly createCashMovementUseCase: CreateCashMovementUseCase,
    private readonly listCashMovementsUseCase: ListCashMovementsUseCase,
  ) {}

  @Get()
  async list(@Query() filters: CashRegisterFiltersDto) {
    const result = await this.listCashRegistersUseCase.execute(filters);
    return BaseResponse.ok(result);
  }

  @Post('open')
  async open(
    @CurrentUser() staff: AuthenticatedStaff,
    @Body() dto: OpenCashRegisterDto,
  ) {
    const result = await this.openCashRegisterUseCase.execute(staff.id, dto);
    return BaseResponse.ok(result, 'Caja abierta');
  }

  @Post('close')
  async close(
    @CurrentUser() staff: AuthenticatedStaff,
    @Body() dto: CloseCashRegisterDto,
  ) {
    const result = await this.closeCashRegisterUseCase.execute(staff.id, dto);
    return BaseResponse.ok(result, 'Caja cerrada');
  }

  @Get('current')
  async current(@CurrentUser() staff: AuthenticatedStaff) {
    const result = await this.getCurrentCashRegisterUseCase.execute(staff.id);
    return BaseResponse.ok(result);
  }

  @Post('movements')
  async createMovement(
    @CurrentUser() staff: AuthenticatedStaff,
    @Body() dto: CreateCashMovementDto,
  ) {
    const result = await this.createCashMovementUseCase.execute(staff.id, dto);
    return BaseResponse.ok(result, 'Movimiento registrado');
  }

  @Get('movements')
  async listMovements(@CurrentUser() staff: AuthenticatedStaff) {
    const result = await this.listCashMovementsUseCase.execute(staff.id);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getCashRegisterUseCase.execute(id);
    return BaseResponse.ok(result);
  }
}
