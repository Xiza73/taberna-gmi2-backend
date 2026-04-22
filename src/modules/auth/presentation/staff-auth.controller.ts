import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { StaffLoginUseCase } from '../application/use-cases/staff-login.use-case';
import { StaffGetMeUseCase } from '../application/use-cases/staff-get-me.use-case';
import { StaffUpdateProfileUseCase } from '../application/use-cases/staff-update-profile.use-case';
import { StaffChangePasswordUseCase } from '../application/use-cases/staff-change-password.use-case';
import { StaffForgotPasswordUseCase } from '../application/use-cases/staff-forgot-password.use-case';
import { StaffResetPasswordUseCase } from '../application/use-cases/staff-reset-password.use-case';
import { StaffGoogleAuthUseCase } from '../application/use-cases/staff-google-auth.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { LoginDto } from '../application/dtos/login.dto';
import { RefreshTokenDto } from '../application/dtos/refresh-token.dto';
import { ForgotPasswordDto } from '../application/dtos/forgot-password.dto';
import { ResetPasswordDto } from '../application/dtos/reset-password.dto';
import { GoogleAuthDto } from '../application/dtos/google-auth.dto';
import { UpdateStaffProfileDto } from '../../staff/application/dtos/update-staff-profile.dto';
import { ChangePasswordDto } from '../../customers/application/dtos/change-password.dto';

@Controller('staff/auth')
export class StaffAuthController {
  constructor(
    private readonly staffLoginUseCase: StaffLoginUseCase,
    private readonly staffGetMeUseCase: StaffGetMeUseCase,
    private readonly staffUpdateProfileUseCase: StaffUpdateProfileUseCase,
    private readonly staffChangePasswordUseCase: StaffChangePasswordUseCase,
    private readonly staffForgotPasswordUseCase: StaffForgotPasswordUseCase,
    private readonly staffResetPasswordUseCase: StaffResetPasswordUseCase,
    private readonly staffGoogleAuthUseCase: StaffGoogleAuthUseCase,
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('google')
  async google(@Body() dto: GoogleAuthDto) {
    const result = await this.staffGoogleAuthUseCase.execute(dto);
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

  @RequireSubjectType(SubjectType.STAFF)
  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') staffId: string,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    const result = await this.staffUpdateProfileUseCase.execute(staffId, dto);
    return BaseResponse.ok(result);
  }

  @RequireSubjectType(SubjectType.STAFF)
  @Patch('change-password')
  async changePassword(
    @CurrentUser('id') staffId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.staffChangePasswordUseCase.execute(staffId, dto);
    return BaseResponse.ok(null, 'Password changed successfully');
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.staffForgotPasswordUseCase.execute(dto);
    return BaseResponse.ok(
      null,
      'If the email exists, a reset link has been sent',
    );
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.staffResetPasswordUseCase.execute(dto);
    return BaseResponse.ok(null, 'Password reset successfully');
  }
}
