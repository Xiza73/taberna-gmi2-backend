import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto';

export class AdminReviewQueryDto extends PaginationDto {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  isApproved?: boolean;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  rating?: number;
}
