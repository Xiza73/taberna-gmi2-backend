import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';

import { type CouponType } from '../enums/coupon-type.enum';

export class Coupon extends BaseEntity {
  private _code: string;
  private _type: CouponType;
  private _value: number;
  private _minPurchase: number | null;
  private _maxDiscount: number | null;
  private _maxUses: number | null;
  private _maxUsesPerUser: number | null;
  private _currentUses: number;
  private _isActive: boolean;
  private _startDate: Date;
  private _endDate: Date;

  private constructor(
    id: string,
    code: string,
    type: CouponType,
    value: number,
    minPurchase: number | null,
    maxDiscount: number | null,
    maxUses: number | null,
    maxUsesPerUser: number | null,
    currentUses: number,
    isActive: boolean,
    startDate: Date,
    endDate: Date,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._code = code;
    this._type = type;
    this._value = value;
    this._minPurchase = minPurchase;
    this._maxDiscount = maxDiscount;
    this._maxUses = maxUses;
    this._maxUsesPerUser = maxUsesPerUser;
    this._currentUses = currentUses;
    this._isActive = isActive;
    this._startDate = startDate;
    this._endDate = endDate;
  }

  static create(props: {
    code: string;
    type: CouponType;
    value: number;
    minPurchase?: number | null;
    maxDiscount?: number | null;
    maxUses?: number | null;
    maxUsesPerUser?: number | null;
    isActive?: boolean;
    startDate: Date;
    endDate: Date;
  }): Coupon {
    if (!props.code) {
      throw new DomainException('Coupon code is required');
    }
    if (props.value <= 0) {
      throw new DomainException('Coupon value must be greater than 0');
    }
    return new Coupon(
      undefined!,
      props.code.toUpperCase(),
      props.type,
      props.value,
      props.minPurchase ?? null,
      props.maxDiscount ?? null,
      props.maxUses ?? null,
      props.maxUsesPerUser ?? 1,
      0,
      props.isActive ?? true,
      props.startDate,
      props.endDate,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    currentUses: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Coupon {
    return new Coupon(
      props.id,
      props.code,
      props.type,
      props.value,
      props.minPurchase,
      props.maxDiscount,
      props.maxUses,
      props.maxUsesPerUser,
      props.currentUses,
      props.isActive,
      props.startDate,
      props.endDate,
      props.createdAt,
      props.updatedAt,
    );
  }

  get code(): string {
    return this._code;
  }
  get type(): CouponType {
    return this._type;
  }
  get value(): number {
    return this._value;
  }
  get minPurchase(): number | null {
    return this._minPurchase;
  }
  get maxDiscount(): number | null {
    return this._maxDiscount;
  }
  get maxUses(): number | null {
    return this._maxUses;
  }
  get maxUsesPerUser(): number | null {
    return this._maxUsesPerUser;
  }
  get currentUses(): number {
    return this._currentUses;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get startDate(): Date {
    return this._startDate;
  }
  get endDate(): Date {
    return this._endDate;
  }

  update(props: {
    code?: string;
    type?: CouponType;
    value?: number;
    minPurchase?: number | null;
    maxDiscount?: number | null;
    maxUses?: number | null;
    maxUsesPerUser?: number | null;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): void {
    if (props.code !== undefined) this._code = props.code.toUpperCase();
    if (props.type !== undefined) this._type = props.type;
    if (props.value !== undefined) this._value = props.value;
    if (props.minPurchase !== undefined) this._minPurchase = props.minPurchase;
    if (props.maxDiscount !== undefined) this._maxDiscount = props.maxDiscount;
    if (props.maxUses !== undefined) this._maxUses = props.maxUses;
    if (props.maxUsesPerUser !== undefined)
      this._maxUsesPerUser = props.maxUsesPerUser;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    if (props.startDate !== undefined) this._startDate = props.startDate;
    if (props.endDate !== undefined) this._endDate = props.endDate;
    this.markUpdated();
  }
}
