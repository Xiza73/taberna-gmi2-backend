import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddressOrmEntity } from './infrastructure/orm-entities/address.orm-entity';
import { AddressRepository } from './infrastructure/repositories/address.repository';
import { ADDRESS_REPOSITORY } from './domain/interfaces/address-repository.interface';
import { ListAddressesUseCase } from './application/use-cases/list-addresses.use-case';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case';
import { SetDefaultAddressUseCase } from './application/use-cases/set-default-address.use-case';
import { AddressesController } from './presentation/addresses.controller';

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
