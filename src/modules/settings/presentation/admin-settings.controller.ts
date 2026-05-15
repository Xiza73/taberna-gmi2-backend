import { Body, Controller, Get, Patch } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { GetStoreSettingsUseCase } from '../application/use-cases/get-store-settings.use-case';
import { UpdateStoreSettingsUseCase } from '../application/use-cases/update-store-settings.use-case';
import { UpdateStoreSettingsDto } from '../application/dtos/update-store-settings.dto';

@Controller('admin/settings')
@RequireSubjectType(SubjectType.STAFF)
export class AdminSettingsController {
  constructor(
    private readonly getStoreSettingsUseCase: GetStoreSettingsUseCase,
    private readonly updateStoreSettingsUseCase: UpdateStoreSettingsUseCase,
  ) {}

  @Get()
  @RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  async get() {
    const result = await this.getStoreSettingsUseCase.execute();
    return BaseResponse.ok(result);
  }

  @Patch()
  @RequireStaffRole(StaffRole.SUPER_ADMIN)
  async update(@Body() dto: UpdateStoreSettingsDto) {
    const result = await this.updateStoreSettingsUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
