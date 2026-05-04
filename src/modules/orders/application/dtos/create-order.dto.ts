import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';

import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { ShippingMethod } from '../../domain/enums/shipping-method.enum';
import { CustomerDocType } from '../../domain/enums/customer-doc-type.enum';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(CustomerDocType)
  @IsOptional()
  customerDocType?: CustomerDocType;

  @ValidateIf((o: CreateOrderDto) => o.customerDocType !== undefined)
  @IsString()
  @Matches(/^\d{8}$|^\d{11}$/, {
    message: 'customerDocNumber must be 8 digits (DNI) or 11 digits (RUC)',
  })
  customerDocNumber?: string;
}
