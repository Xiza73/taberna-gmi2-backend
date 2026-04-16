import { Inject, Injectable } from '@nestjs/common';

import { BANNER_REPOSITORY, type IBannerRepository } from '../../domain/interfaces/banner-repository.interface.js';
import { Banner } from '../../domain/entities/banner.entity.js';
import { type CreateBannerDto } from '../dtos/create-banner.dto.js';
import { BannerResponseDto } from '../dtos/banner-response.dto.js';

@Injectable()
export class CreateBannerUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY) private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(dto: CreateBannerDto): Promise<BannerResponseDto> {
    const banner = Banner.create({
      title: dto.title,
      imageUrl: dto.imageUrl,
      linkUrl: dto.linkUrl,
      position: dto.position,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    const saved = await this.bannerRepository.save(banner);
    return new BannerResponseDto(saved);
  }
}
