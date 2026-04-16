import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './infrastructure/orm-entities/user.orm-entity.js';
import { UserRepository } from './infrastructure/repositories/user.repository.js';
import { USER_REPOSITORY } from './domain/interfaces/user-repository.interface.js';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case.js';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case.js';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case.js';
import { GetUserUseCase } from './application/use-cases/get-user.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { SuspendUserUseCase } from './application/use-cases/suspend-user.use-case.js';
import { ActivateUserUseCase } from './application/use-cases/activate-user.use-case.js';
import { UsersController } from './presentation/users.controller.js';
import { AdminUsersController } from './presentation/admin-users.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [
    // Repositories
    { provide: USER_REPOSITORY, useClass: UserRepository },
    // Use Cases
    GetProfileUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    SuspendUserUseCase,
    ActivateUserUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
