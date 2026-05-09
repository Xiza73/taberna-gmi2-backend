import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CustomerDocType } from '@modules/orders/domain/enums/customer-doc-type.enum';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';

export class CreatePosOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePosOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePosOrderItemDto)
  items: CreatePosOrderItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(OrderChannel)
  @ValidateIf((o: CreatePosOrderDto) => o.channel !== undefined)
  channel: OrderChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customerName: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customerPhone?: string;

  @IsEnum(CustomerDocType)
  @IsOptional()
  customerDocType?: CustomerDocType;

  @ValidateIf((o: CreatePosOrderDto) => o.customerDocType !== undefined)
  @IsString()
  @Matches(/^\d{8}$|^\d{11}$/, {
    message: 'customerDocNumber must be 8 digits (DNI) or 11 digits (RUC)',
  })
  customerDocNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  couponCode?: string;

  /** Solo WhatsApp con delivery — para POS presencial es null. */
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  generateInvoice?: boolean;
}
