import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerOrmEntity } from './infrastructure/orm-entities/customer.orm-entity.js';
import { CustomerRepository } from './infrastructure/repositories/customer.repository.js';
import { CUSTOMER_REPOSITORY } from './domain/interfaces/customer-repository.interface.js';
import { GetCustomerProfileUseCase } from './application/use-cases/get-customer-profile.use-case.js';
import { UpdateCustomerProfileUseCase } from './application/use-cases/update-customer-profile.use-case.js';
import { ChangeCustomerPasswordUseCase } from './application/use-cases/change-customer-password.use-case.js';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case.js';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case.js';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case.js';
import { SuspendCustomerUseCase } from './application/use-cases/suspend-customer.use-case.js';
import { ActivateCustomerUseCase } from './application/use-cases/activate-customer.use-case.js';
import { CustomersController } from './presentation/customers.controller.js';
import { AdminCustomersController } from './presentation/admin-customers.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrmEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CustomersController, AdminCustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerRepository },
    GetCustomerProfileUseCase,
    UpdateCustomerProfileUseCase,
    ChangeCustomerPasswordUseCase,
    ListCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    SuspendCustomerUseCase,
    ActivateCustomerUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
