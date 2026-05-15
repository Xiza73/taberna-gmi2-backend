import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoreSettingsOrmEntity } from './infrastructure/orm-entities/store-settings.orm-entity';
import { StoreSettingsRepository } from './infrastructure/repositories/store-settings.repository';
import { STORE_SETTINGS_REPOSITORY } from './domain/interfaces/store-settings-repository.interface';
import { GetStoreSettingsUseCase } from './application/use-cases/get-store-settings.use-case';
import { UpdateStoreSettingsUseCase } from './application/use-cases/update-store-settings.use-case';
import { AdminSettingsController } from './presentation/admin-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSettingsOrmEntity])],
  controllers: [AdminSettingsController],
  providers: [
    { provide: STORE_SETTINGS_REPOSITORY, useClass: StoreSettingsRepository },
    GetStoreSettingsUseCase,
    UpdateStoreSettingsUseCase,
  ],
  exports: [STORE_SETTINGS_REPOSITORY],
})
export class SettingsModule {}
