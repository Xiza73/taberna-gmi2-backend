import { type Coupon } from '../../domain/entities/coupon.entity';

export class PublicCouponResponseDto {
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  endDate: string;

  constructor(coupon: Coupon) {
    this.code = coupon.code;
    this.type = coupon.type;
    this.value = coupon.value;
    this.minPurchase = coupon.minPurchase;
    this.maxDiscount = coupon.maxDiscount;
    this.endDate = coupon.endDate.toISOString();
  }
}
