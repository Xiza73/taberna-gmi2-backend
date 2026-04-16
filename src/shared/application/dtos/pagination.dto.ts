import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const MAX_PAGE_SIZE = 50;

export class PaginationDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
