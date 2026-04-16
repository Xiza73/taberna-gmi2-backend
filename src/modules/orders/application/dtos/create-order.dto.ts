import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
