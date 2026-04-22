import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { CouponType } from '../../domain/enums/coupon-type.enum';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsInt()
  @Min(1)
  value: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minPurchase?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsesPerUser?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
