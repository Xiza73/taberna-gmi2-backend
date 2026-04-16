import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationDto } from '@shared/application/dtos/pagination.dto.js';

export class UserQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'customer'])
  role?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Type(() => Boolean)
  isActive?: boolean;
}
