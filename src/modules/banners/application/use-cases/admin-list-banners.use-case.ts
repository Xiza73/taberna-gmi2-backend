import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  BANNER_REPOSITORY,
  type IBannerRepository,
} from '../../domain/interfaces/banner-repository.interface';
import { type BannerQueryDto } from '../dtos/banner-query.dto';
import { BannerResponseDto } from '../dtos/banner-response.dto';

@Injectable()
export class AdminListBannersUseCase {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepository: IBannerRepository,
  ) {}

  async execute(
    query: BannerQueryDto,
  ): Promise<PaginatedResponseDto<BannerResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.bannerRepository.findAll({
      page,
      limit,
      search: query.search,
      isActive: query.isActive,
      position: query.position,
    });

    return new PaginatedResponseDto(
      items.map((b) => new BannerResponseDto(b)),
      total,
      page,
      limit,
    );
  }
}
