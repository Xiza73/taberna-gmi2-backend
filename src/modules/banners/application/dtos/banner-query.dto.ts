import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto';

import { BannerPosition } from '../../domain/enums/banner-position.enum';

export class BannerQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  isActive?: boolean;

  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;
}
