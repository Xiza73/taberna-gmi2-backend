import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Carrier } from '../../domain/enums/carrier.enum.js';
import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';

export class UpdateShipmentDto {
  @IsEnum(Carrier)
  @IsOptional()
  carrier?: Carrier;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
