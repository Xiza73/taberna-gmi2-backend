import { Inject, Injectable } from '@nestjs/common';

import { StoreSettings } from '../../domain/entities/store-settings.entity';
import {
  STORE_SETTINGS_REPOSITORY,
  type IStoreSettingsRepository,
} from '../../domain/interfaces/store-settings-repository.interface';
import { type UpdateStoreSettingsDto } from '../dtos/update-store-settings.dto';
import { StoreSettingsResponseDto } from '../dtos/store-settings-response.dto';

@Injectable()
export class UpdateStoreSettingsUseCase {
  constructor(
    @Inject(STORE_SETTINGS_REPOSITORY)
    private readonly repository: IStoreSettingsRepository,
  ) {}

  async execute(dto: UpdateStoreSettingsDto): Promise<StoreSettingsResponseDto> {
    let settings = await this.repository.findSingleton();
    if (!settings) {
      settings = StoreSettings.createDefault();
    }
    settings.update(dto);
    const saved = await this.repository.save(settings);
    return new StoreSettingsResponseDto(saved);
  }
}
