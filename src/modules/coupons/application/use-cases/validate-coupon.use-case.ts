import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { COUPON_REPOSITORY, type ICouponRepository } from '../../domain/interfaces/coupon-repository.interface.js';
import { COUPON_CALCULATOR, type CouponCalculator } from '../../domain/services/coupon-calculator.js';
import { type ValidateCouponDto } from '../dtos/validate-coupon.dto.js';
import { CouponValidationResponseDto } from '../dtos/coupon-response.dto.js';

@Injectable()
export class ValidateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly couponRepository: ICouponRepository,
    @Inject(COUPON_CALCULATOR) private readonly couponCalculator: CouponCalculator,
  ) {}

  async execute(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    const coupon = await this.couponRepository.findByCode(dto.code);
    if (!coupon) {
      throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
    }

    this.couponCalculator.validate(coupon, dto.subtotal);
    const discount = this.couponCalculator.calculateDiscount(coupon, dto.subtotal);

    return new CouponValidationResponseDto({
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discount,
    });
  }
}
