import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddressOrmEntity } from './infrastructure/orm-entities/address.orm-entity.js';
import { AddressRepository } from './infrastructure/repositories/address.repository.js';
import { ADDRESS_REPOSITORY } from './domain/interfaces/address-repository.interface.js';
import { ListAddressesUseCase } from './application/use-cases/list-addresses.use-case.js';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case.js';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case.js';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case.js';
import { SetDefaultAddressUseCase } from './application/use-cases/set-default-address.use-case.js';
import { AddressesController } from './presentation/addresses.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AddressOrmEntity])],
  controllers: [AddressesController],
  providers: [
    { provide: ADDRESS_REPOSITORY, useClass: AddressRepository },
    ListAddressesUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    SetDefaultAddressUseCase,
  ],
  exports: [ADDRESS_REPOSITORY],
})
export class AddressesModule {}
