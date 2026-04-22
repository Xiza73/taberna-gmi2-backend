import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshTokenOrmEntity } from './infrastructure/orm-entities/refresh-token.orm-entity';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository';
import { RefreshTokenCleanupCron } from './infrastructure/cron/refresh-token-cleanup.cron';
import { REFRESH_TOKEN_REPOSITORY } from './domain/interfaces/refresh-token-repository.interface';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { StaffLoginUseCase } from './application/use-cases/staff-login.use-case';
import { StaffGetMeUseCase } from './application/use-cases/staff-get-me.use-case';
import { StaffUpdateProfileUseCase } from './application/use-cases/staff-update-profile.use-case';
import { StaffChangePasswordUseCase } from './application/use-cases/staff-change-password.use-case';
import { StaffForgotPasswordUseCase } from './application/use-cases/staff-forgot-password.use-case';
import { StaffResetPasswordUseCase } from './application/use-cases/staff-reset-password.use-case';
import { StaffGoogleAuthUseCase } from './application/use-cases/staff-google-auth.use-case';
import { AuthController } from './presentation/auth.controller';
import { StaffAuthController } from './presentation/staff-auth.controller';
import { CustomersModule } from '../customers/customers.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenOrmEntity]),
    forwardRef(() => CustomersModule),
    StaffModule,
  ],
  controllers: [AuthController, StaffAuthController],
  providers: [
    // Repositories
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
    // Cron
    RefreshTokenCleanupCron,
    // Use Cases — Customer Auth
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetMeUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GoogleAuthUseCase,
    // Use Cases — Staff Auth
    StaffLoginUseCase,
    StaffGetMeUseCase,
    StaffUpdateProfileUseCase,
    StaffChangePasswordUseCase,
    StaffForgotPasswordUseCase,
    StaffResetPasswordUseCase,
    StaffGoogleAuthUseCase,
  ],
  exports: [REFRESH_TOKEN_REPOSITORY],
})
export class AuthModule {}
