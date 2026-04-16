import { Body, Controller, Get, Patch } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';

import { GetProfileUseCase } from '../application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case.js';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case.js';
import { UpdateProfileDto } from '../application/dtos/update-profile.dto.js';
import { ChangePasswordDto } from '../application/dtos/change-password.dto.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const result = await this.getProfileUseCase.execute(userId);
    return BaseResponse.ok(result);
  }

  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const result = await this.updateProfileUseCase.execute(userId, dto);
    return BaseResponse.ok(result);
  }

  @Patch('change-password')
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    await this.changePasswordUseCase.execute(userId, dto);
    return BaseResponse.ok(null, 'Password changed successfully');
  }
}
