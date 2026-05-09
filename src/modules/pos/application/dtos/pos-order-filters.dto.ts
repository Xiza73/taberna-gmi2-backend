import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaginationDto } from '@shared/application/dtos/pagination.dto';

import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';

export class PosOrderFiltersDto extends PaginationDto {
  @IsEnum(OrderChannel)
  @IsOptional()
  channel?: OrderChannel;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['createdAt', 'total', 'oldest'])
  sortBy?: string;
}
