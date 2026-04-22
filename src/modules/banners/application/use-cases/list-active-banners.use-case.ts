import { Inject, Injectable } from '@nestjs/common';

import {
  BANNER_REPOSITORY,
  type IBannerRepository,
} from '../../domain/interfaces/banner-repository.interface';
import { BannerResponseDto } from '../dtos/banner-response.dto';

@Injectable()
export class ListActiveBannersUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(): Promise<BannerResponseDto[]> {
    const banners = await this.bannerRepository.findAllActive();
    return banners.map((b) => new BannerResponseDto(b));
  }
}
