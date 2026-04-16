import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationDto } from '@shared/application/dtos/pagination.dto.js';

import { OrderStatus } from '../../domain/enums/order-status.enum.js';

export class OrderQueryDto extends PaginationDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}

export class AdminOrderQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;
}
