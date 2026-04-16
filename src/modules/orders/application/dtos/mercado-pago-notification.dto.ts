import { IsOptional, IsString } from 'class-validator';

export class MercadoPagoNotificationDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsOptional()
  data?: { id?: string };
}
