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
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { CreateStaffMemberUseCase } from '../application/use-cases/create-staff-member.use-case';
import { ListStaffMembersUseCase } from '../application/use-cases/list-staff-members.use-case';
import { GetStaffMemberUseCase } from '../application/use-cases/get-staff-member.use-case';
import { UpdateStaffMemberUseCase } from '../application/use-cases/update-staff-member.use-case';
import { SuspendStaffMemberUseCase } from '../application/use-cases/suspend-staff-member.use-case';
import { ActivateStaffMemberUseCase } from '../application/use-cases/activate-staff-member.use-case';
import { ChangeStaffRoleUseCase } from '../application/use-cases/change-staff-role.use-case';
import { CreateStaffMemberDto } from '../application/dtos/create-staff-member.dto';
import { StaffQueryDto } from '../application/dtos/staff-query.dto';
import { UpdateStaffMemberDto } from '../application/dtos/update-staff-member.dto';
import { ChangeStaffRoleDto } from '../application/dtos/change-staff-role.dto';

@Controller('admin/staff')
@RequireSubjectType(SubjectType.STAFF)
@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
export class AdminStaffController {
  constructor(
    private readonly createStaffMemberUseCase: CreateStaffMemberUseCase,
    private readonly listStaffMembersUseCase: ListStaffMembersUseCase,
    private readonly getStaffMemberUseCase: GetStaffMemberUseCase,
    private readonly updateStaffMemberUseCase: UpdateStaffMemberUseCase,
    private readonly suspendStaffMemberUseCase: SuspendStaffMemberUseCase,
    private readonly activateStaffMemberUseCase: ActivateStaffMemberUseCase,
    private readonly changeStaffRoleUseCase: ChangeStaffRoleUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateStaffMemberDto) {
    const result = await this.createStaffMemberUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Get()
  async list(@Query() query: StaffQueryDto) {
    const result = await this.listStaffMembersUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getStaffMemberUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: UpdateStaffMemberDto,
  ) {
    const result = await this.updateStaffMemberUseCase.execute(
      id,
      currentUserId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Patch(':id/role')
  @RequireStaffRole(StaffRole.SUPER_ADMIN)
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: ChangeStaffRoleDto,
  ) {
    const result = await this.changeStaffRoleUseCase.execute(
      id,
      currentUserId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Patch(':id/suspend')
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.suspendStaffMemberUseCase.execute(id, currentUserId);
    return BaseResponse.ok();
  }

  @Patch(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    await this.activateStaffMemberUseCase.execute(id);
    return BaseResponse.ok();
  }
}
