import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { CouponType } from '../../domain/enums/coupon-type.enum.js';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @IsInt()
  @Min(1)
  @IsOptional()
  value?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minPurchase?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxDiscount?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsesPerUser?: number | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
