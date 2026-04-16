import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto.js';

export class ProductQueryDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn(['price', 'price_desc', 'name', 'newest', 'rating'])
  sortBy?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  includeInactive?: boolean;
}
