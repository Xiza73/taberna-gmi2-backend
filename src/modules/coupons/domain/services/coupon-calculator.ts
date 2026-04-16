import { DomainException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { type Coupon } from '../entities/coupon.entity.js';
import { CouponType } from '../enums/coupon-type.enum.js';

export const COUPON_CALCULATOR = Symbol('COUPON_CALCULATOR');

export class CouponCalculator {
  validate(coupon: Coupon, subtotal: number): void {
    if (!coupon.isActive) {
      throw new DomainException(ErrorMessages.COUPON_INACTIVE);
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new DomainException(ErrorMessages.COUPON_EXPIRED);
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      throw new DomainException(ErrorMessages.COUPON_LIMIT_REACHED);
    }

    if (coupon.minPurchase !== null && subtotal < coupon.minPurchase) {
      throw new DomainException(ErrorMessages.COUPON_MIN_PURCHASE);
    }
  }

  calculateDiscount(coupon: Coupon, subtotal: number): number {
    let discount: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    return Math.min(discount, subtotal);
  }
}
