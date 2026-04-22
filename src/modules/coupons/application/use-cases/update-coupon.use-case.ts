import { Inject, Injectable } from '@nestjs/common';

import {
  DomainConflictException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '../../domain/interfaces/coupon-repository.interface';
import { type UpdateCouponDto } from '../dtos/update-coupon.dto';
import { CouponResponseDto } from '../dtos/coupon-response.dto';

@Injectable()
export class UpdateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
    }

    if (dto.code !== undefined) {
      const codeExists = await this.couponRepository.codeExists(dto.code, id);
      if (codeExists) {
        throw new DomainConflictException(
          ErrorMessages.COUPON_CODE_ALREADY_EXISTS,
        );
      }
    }

    coupon.update({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minPurchase: dto.minPurchase,
      maxDiscount: dto.maxDiscount,
      maxUses: dto.maxUses,
      maxUsesPerUser: dto.maxUsesPerUser,
      isActive: dto.isActive,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    const saved = await this.couponRepository.save(coupon);
    return new CouponResponseDto(saved);
  }
}
