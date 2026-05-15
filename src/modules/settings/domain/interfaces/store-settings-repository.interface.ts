import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type StoreSettings } from '../entities/store-settings.entity';

export const STORE_SETTINGS_REPOSITORY = Symbol('STORE_SETTINGS_REPOSITORY');

export interface IStoreSettingsRepository extends IBaseRepository<StoreSettings> {
  findSingleton(): Promise<StoreSettings | null>;
}
