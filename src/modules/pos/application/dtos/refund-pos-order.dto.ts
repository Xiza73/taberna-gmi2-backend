import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RefundPosOrderItemDto {
  @IsUUID()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class RefundPosOrderDto {
  /**
   * Si está vacío o ausente, devolución TOTAL (restaura todo el stock + status
   * pasa a `refunded`). Si tiene items, devolución PARCIAL (restaura stock
   * parcial + status NO cambia).
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RefundPosOrderItemDto)
  items?: RefundPosOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
