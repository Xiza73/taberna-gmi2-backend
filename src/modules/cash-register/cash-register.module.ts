import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '@modules/orders/orders.module';

import { CASH_MOVEMENT_REPOSITORY } from './domain/interfaces/cash-movement-repository.interface';
import { CASH_REGISTER_REPOSITORY } from './domain/interfaces/cash-register-repository.interface';
import { CloseCashRegisterUseCase } from './application/use-cases/close-cash-register.use-case';
import { CreateCashMovementUseCase } from './application/use-cases/create-cash-movement.use-case';
import { GetCashRegisterUseCase } from './application/use-cases/get-cash-register.use-case';
import { GetCurrentCashRegisterUseCase } from './application/use-cases/get-current-cash-register.use-case';
import { ListCashMovementsUseCase } from './application/use-cases/list-cash-movements.use-case';
import { OpenCashRegisterUseCase } from './application/use-cases/open-cash-register.use-case';
import { CashMovementOrmEntity } from './infrastructure/orm-entities/cash-movement.orm-entity';
import { CashRegisterOrmEntity } from './infrastructure/orm-entities/cash-register.orm-entity';
import { CashMovementRepository } from './infrastructure/repositories/cash-movement.repository';
import { CashRegisterRepository } from './infrastructure/repositories/cash-register.repository';
import { AdminCashRegisterController } from './presentation/admin-cash-register.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashRegisterOrmEntity, CashMovementOrmEntity]),
    OrdersModule,
  ],
  controllers: [AdminCashRegisterController],
  providers: [
    OpenCashRegisterUseCase,
    CloseCashRegisterUseCase,
    GetCurrentCashRegisterUseCase,
    GetCashRegisterUseCase,
    CreateCashMovementUseCase,
    ListCashMovementsUseCase,
    { provide: CASH_REGISTER_REPOSITORY, useClass: CashRegisterRepository },
    { provide: CASH_MOVEMENT_REPOSITORY, useClass: CashMovementRepository },
  ],
  exports: [CASH_REGISTER_REPOSITORY, CASH_MOVEMENT_REPOSITORY],
})
export class CashRegisterModule {}
