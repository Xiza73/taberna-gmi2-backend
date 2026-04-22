import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  BANNER_REPOSITORY,
  type IBannerRepository,
} from '../../domain/interfaces/banner-repository.interface';
import { type UpdateBannerDto } from '../dtos/update-banner.dto';
import { BannerResponseDto } from '../dtos/banner-response.dto';

@Injectable()
export class UpdateBannerUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(id: string, dto: UpdateBannerDto): Promise<BannerResponseDto> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new DomainNotFoundException(ErrorMessages.BANNER_NOT_FOUND);
    }

    banner.update({
      ...dto,
      startDate:
        dto.startDate !== undefined
          ? dto.startDate
            ? new Date(dto.startDate)
            : null
          : undefined,
      endDate:
        dto.endDate !== undefined
          ? dto.endDate
            ? new Date(dto.endDate)
            : null
          : undefined,
    });

    const saved = await this.bannerRepository.save(banner);
    return new BannerResponseDto(saved);
  }
}
