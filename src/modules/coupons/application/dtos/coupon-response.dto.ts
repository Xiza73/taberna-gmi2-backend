import { type Coupon } from '../../domain/entities/coupon.entity';

export class CouponResponseDto {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  currentUses: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;

  constructor(coupon: Coupon) {
    this.id = coupon.id;
    this.code = coupon.code;
    this.type = coupon.type;
    this.value = coupon.value;
    this.minPurchase = coupon.minPurchase;
    this.maxDiscount = coupon.maxDiscount;
    this.maxUses = coupon.maxUses;
    this.maxUsesPerUser = coupon.maxUsesPerUser;
    this.currentUses = coupon.currentUses;
    this.isActive = coupon.isActive;
    this.startDate = coupon.startDate.toISOString();
    this.endDate = coupon.endDate.toISOString();
    this.createdAt = coupon.createdAt.toISOString();
    this.updatedAt = coupon.updatedAt.toISOString();
  }
}

export class CouponValidationResponseDto {
  couponId: string;
  code: string;
  type: string;
  discount: number;

  constructor(props: {
    couponId: string;
    code: string;
    type: string;
    discount: number;
  }) {
    this.couponId = props.couponId;
    this.code = props.code;
    this.type = props.type;
    this.discount = props.discount;
  }
}
