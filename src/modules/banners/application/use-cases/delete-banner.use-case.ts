import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  BANNER_REPOSITORY,
  type IBannerRepository,
} from '../../domain/interfaces/banner-repository.interface';

@Injectable()
export class DeleteBannerUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new DomainNotFoundException(ErrorMessages.BANNER_NOT_FOUND);
    }
    await this.bannerRepository.delete(id);
  }
}
