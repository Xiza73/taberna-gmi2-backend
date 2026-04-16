import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshTokenOrmEntity } from './infrastructure/orm-entities/refresh-token.orm-entity.js';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository.js';
import { RefreshTokenCleanupCron } from './infrastructure/cron/refresh-token-cleanup.cron.js';
import { REFRESH_TOKEN_REPOSITORY } from './domain/interfaces/refresh-token-repository.interface.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout.use-case.js';
import { GetMeUseCase } from './application/use-cases/get-me.use-case.js';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case.js';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case.js';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case.js';
import { AuthController } from './presentation/auth.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenOrmEntity]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
    // Cron
    RefreshTokenCleanupCron,
    // Use Cases
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetMeUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GoogleAuthUseCase,
  ],
  exports: [REFRESH_TOKEN_REPOSITORY],
})
export class AuthModule {}
