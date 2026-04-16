import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { COUPON_REPOSITORY, type ICouponRepository } from '../../domain/interfaces/coupon-repository.interface.js';

@Injectable()
export class DeleteCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
    }
    await this.couponRepository.delete(id);
  }
}
