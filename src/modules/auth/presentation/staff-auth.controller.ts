import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Public } from '@shared/presentation/decorators/public.decorator.js';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator.js';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator.js';
import { SubjectType } from '@shared/domain/enums/subject-type.enum.js';

import { StaffLoginUseCase } from '../application/use-cases/staff-login.use-case.js';
import { StaffGetMeUseCase } from '../application/use-cases/staff-get-me.use-case.js';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case.js';
import { LogoutUseCase } from '../application/use-cases/logout.use-case.js';
import { LoginDto } from '../application/dtos/login.dto.js';
import { RefreshTokenDto } from '../application/dtos/refresh-token.dto.js';

@Controller('staff/auth')
export class StaffAuthController {
  constructor(
    private readonly staffLoginUseCase: StaffLoginUseCase,
    private readonly staffGetMeUseCase: StaffGetMeUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.staffLoginUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @RequireSubjectType(SubjectType.STAFF)
  @Post('logout')
  async logout(@CurrentUser('id') staffId: string) {
    await this.logoutUseCase.execute(staffId);
    return BaseResponse.ok(null, 'Logged out successfully');
  }

  @RequireSubjectType(SubjectType.STAFF)
  @Get('me')
  async me(@CurrentUser('id') staffId: string) {
    const result = await this.staffGetMeUseCase.execute(staffId);
    return BaseResponse.ok(result);
  }
}
