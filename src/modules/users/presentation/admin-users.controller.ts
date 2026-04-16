import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { ListUsersUseCase } from '../application/use-cases/list-users.use-case.js';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case.js';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case.js';
import { SuspendUserUseCase } from '../application/use-cases/suspend-user.use-case.js';
import { ActivateUserUseCase } from '../application/use-cases/activate-user.use-case.js';
import { UserQueryDto } from '../application/dtos/user-query.dto.js';
import { UpdateUserDto } from '../application/dtos/update-user.dto.js';

@Controller('admin/users')
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
  ) {}

  @Get()
  async list(@Query() query: UserQueryDto) {
    const result = await this.listUsersUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getUserUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    const result = await this.updateUserUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Post(':id/suspend')
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.suspendUserUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.activateUserUseCase.execute(id);
    return BaseResponse.ok(result);
  }
}
