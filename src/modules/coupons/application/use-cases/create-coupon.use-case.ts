import { Inject, Injectable } from '@nestjs/common';

import { DomainConflictException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { Coupon } from '../../domain/entities/coupon.entity.js';
import { COUPON_REPOSITORY, type ICouponRepository } from '../../domain/interfaces/coupon-repository.interface.js';
import { type CreateCouponDto } from '../dtos/create-coupon.dto.js';
import { CouponResponseDto } from '../dtos/coupon-response.dto.js';

@Injectable()
export class CreateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const exists = await this.couponRepository.codeExists(dto.code);
    if (exists) {
      throw new DomainConflictException(ErrorMessages.COUPON_CODE_ALREADY_EXISTS);
    }

    const coupon = Coupon.create({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minPurchase: dto.minPurchase,
      maxDiscount: dto.maxDiscount,
      maxUses: dto.maxUses,
      maxUsesPerUser: dto.maxUsesPerUser,
      isActive: dto.isActive,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    const saved = await this.couponRepository.save(coupon);
    return new CouponResponseDto(saved);
  }
}
