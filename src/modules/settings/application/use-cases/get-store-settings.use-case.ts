import { Inject, Injectable } from '@nestjs/common';

import { StoreSettings } from '../../domain/entities/store-settings.entity';
import {
  STORE_SETTINGS_REPOSITORY,
  type IStoreSettingsRepository,
} from '../../domain/interfaces/store-settings-repository.interface';
import { StoreSettingsResponseDto } from '../dtos/store-settings-response.dto';

@Injectable()
export class GetStoreSettingsUseCase {
  constructor(
    @Inject(STORE_SETTINGS_REPOSITORY)
    private readonly repository: IStoreSettingsRepository,
  ) {}

  async execute(): Promise<StoreSettingsResponseDto> {
    let settings = await this.repository.findSingleton();
    if (!settings) {
      settings = await this.repository.save(StoreSettings.createDefault());
    }
    return new StoreSettingsResponseDto(settings);
  }
}
