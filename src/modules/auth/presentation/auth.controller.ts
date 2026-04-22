import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { GoogleAuthUseCase } from '../application/use-cases/google-auth.use-case';
import { RegisterDto } from '../application/dtos/register.dto';
import { LoginDto } from '../application/dtos/login.dto';
import { RefreshTokenDto } from '../application/dtos/refresh-token.dto';
import { ForgotPasswordDto } from '../application/dtos/forgot-password.dto';
import { ResetPasswordDto } from '../application/dtos/reset-password.dto';
import { GoogleAuthDto } from '../application/dtos/google-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @RequireSubjectType(SubjectType.CUSTOMER)
  @Post('logout')
  async logout(@CurrentUser('id') userId: string) {
    await this.logoutUseCase.execute(userId);
    return BaseResponse.ok(null, 'Logged out successfully');
  }

  @RequireSubjectType(SubjectType.CUSTOMER)
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const result = await this.getMeUseCase.execute(userId);
    return BaseResponse.ok(result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('google')
  async google(@Body() dto: GoogleAuthDto) {
    const result = await this.googleAuthUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(dto);
    return BaseResponse.ok(
      null,
      'If the email exists, a reset link has been sent',
    );
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto);
    return BaseResponse.ok(null, 'Password reset successfully');
  }
}
