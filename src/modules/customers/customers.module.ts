import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerOrmEntity } from './infrastructure/orm-entities/customer.orm-entity';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from './domain/interfaces/customer-repository.interface';
import { GetCustomerProfileUseCase } from './application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from './application/use-cases/update-customer-profile.use-case';
import { ChangeCustomerPasswordUseCase } from './application/use-cases/change-customer-password.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { SuspendCustomerUseCase } from './application/use-cases/suspend-customer.use-case';
import { ActivateCustomerUseCase } from './application/use-cases/activate-customer.use-case';
import { CustomersController } from './presentation/customers.controller';
import { AdminCustomersController } from './presentation/admin-customers.controller';
import { AuthModule } from '../auth/auth.module';

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
