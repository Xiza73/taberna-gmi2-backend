import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto';

import { CouponType } from '../../domain/enums/coupon-type.enum';

export class CouponQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  isActive?: boolean;

  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;
}
