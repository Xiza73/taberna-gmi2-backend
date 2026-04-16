import { Inject, Injectable } from '@nestjs/common';

import {
  PaginatedResponseDto,
  PaginationDto,
} from '@shared/application/dtos/pagination.dto.js';

import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '../../domain/interfaces/coupon-repository.interface.js';
import { CouponResponseDto } from '../dtos/coupon-response.dto.js';

@Injectable()
export class AdminListCouponsUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(
    query: PaginationDto,
  ): Promise<PaginatedResponseDto<CouponResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.couponRepository.findAll({
      page,
      limit,
    });

    return new PaginatedResponseDto(
      items.map((c) => new CouponResponseDto(c)),
      total,
      page,
      limit,
    );
  }
}
