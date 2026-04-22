import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Carrier } from '../../domain/enums/carrier.enum';

export class CreateShipmentDto {
  @IsEnum(Carrier)
  carrier: Carrier;

  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
