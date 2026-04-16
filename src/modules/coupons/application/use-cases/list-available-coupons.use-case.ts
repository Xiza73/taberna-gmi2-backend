import { Inject, Injectable } from '@nestjs/common';

import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '../../domain/interfaces/coupon-repository.interface.js';
import { PublicCouponResponseDto } from '../dtos/public-coupon-response.dto.js';

@Injectable()
export class ListAvailableCouponsUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(
    page: number,
    limit: number,
  ): Promise<{ items: PublicCouponResponseDto[]; total: number }> {
    const { items, total } = await this.couponRepository.findActive({
      page,
      limit,
    });
    return {
      items: items.map((c) => new PublicCouponResponseDto(c)),
      total,
    };
  }
}
