import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { ListCustomersUseCase } from '../application/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from '../application/use-cases/update-customer.use-case';
import { SuspendCustomerUseCase } from '../application/use-cases/suspend-customer.use-case';
import { ActivateCustomerUseCase } from '../application/use-cases/activate-customer.use-case';
import { CustomerQueryDto } from '../application/dtos/customer-query.dto';
import { UpdateCustomerDto } from '../application/dtos/update-customer.dto';

@Controller('admin/customers')
@RequireSubjectType(SubjectType.STAFF)
export class AdminCustomersController {
  constructor(
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly suspendCustomerUseCase: SuspendCustomerUseCase,
    private readonly activateCustomerUseCase: ActivateCustomerUseCase,
  ) {}

  @Get()
  async list(@Query() query: CustomerQueryDto) {
    const result = await this.listCustomersUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getCustomerUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const result = await this.updateCustomerUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Post(':id/suspend')
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.suspendCustomerUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.activateCustomerUseCase.execute(id);
    return BaseResponse.ok(result);
  }
}
