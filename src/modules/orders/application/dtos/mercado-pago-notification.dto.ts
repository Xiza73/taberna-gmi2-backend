import { IsOptional } from 'class-validator';

/**
 * Payload de webhooks de MercadoPago. Solo declaramos los campos que
 * realmente usamos en el controller (`type` y `data.id`); el resto de
 * campos que MP envía (`id`, `user_id`, `live_mode`, `version`,
 * `api_version`, `date_created`, etc.) se ignoran sin tirar 400.
 *
 * Con `forbidNonWhitelisted: false` y `whitelist: false` en el pipe del
 * controller, MP puede enviar cualquier estructura adicional (eventos
 * de test como `stop_delivery_op_wh` o campos nuevos que MP agregue en
 * el futuro) sin romper el endpoint.
 */
export class MercadoPagoNotificationDto {
  @IsOptional()
  type?: string;

  @IsOptional()
  action?: string;

  @IsOptional()
  data?: { id?: string; [key: string]: unknown };

  // Pasamos-through cualquier otro campo que MP envíe.
  [key: string]: unknown;
}
