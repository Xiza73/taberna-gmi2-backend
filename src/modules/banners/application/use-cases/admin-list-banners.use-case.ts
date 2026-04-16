import { Inject, Injectable } from '@nestjs/common';

import {
  PaginatedResponseDto,
  PaginationDto,
} from '@shared/application/dtos/pagination.dto.js';

import {
  BANNER_REPOSITORY,
  type IBannerRepository,
} from '../../domain/interfaces/banner-repository.interface.js';
import { BannerResponseDto } from '../dtos/banner-response.dto.js';

@Injectable()
export class AdminListBannersUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(
    query: PaginationDto,
  ): Promise<PaginatedResponseDto<BannerResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.bannerRepository.findAll({
      page,
      limit,
      includeInactive: true,
    });

    return new PaginatedResponseDto(
      items.map((b) => new BannerResponseDto(b)),
      total,
      page,
      limit,
    );
  }
}
