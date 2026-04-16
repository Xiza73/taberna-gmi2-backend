import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto.js';

export class CategoryQueryDto extends PaginationDto {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  includeInactive?: boolean;
}
