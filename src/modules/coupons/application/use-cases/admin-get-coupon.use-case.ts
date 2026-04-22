import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '../../domain/interfaces/coupon-repository.interface';
import { CouponResponseDto } from '../dtos/coupon-response.dto';

@Injectable()
export class AdminGetCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(id: string): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
    }
    return new CouponResponseDto(coupon);
  }
}
