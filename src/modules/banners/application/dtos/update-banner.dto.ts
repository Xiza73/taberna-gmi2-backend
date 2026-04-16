import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { BannerPosition } from '../../domain/enums/banner-position.enum.js';

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string | null;

  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @IsDateString()
  @IsOptional()
  endDate?: string | null;
}
