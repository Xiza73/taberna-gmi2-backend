import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { ProcessPaymentNotificationUseCase } from '../application/use-cases/process-payment-notification.use-case';

/**
 * MercadoPago envía notificaciones con DOS formatos:
 *
 * 1. WebHook v1.0 (User-Agent "MercadoPago WebHook v1.0"):
 *    POST /webhooks/mercadopago?data.id=X&type=payment
 *    Body: { type: "payment", action: "...", data: { id: "X" }, ... }
 *
 * 2. Feed v2.0 (User-Agent "MercadoPago Feed v2.0", legacy IPN):
 *    POST /webhooks/mercadopago?id=X&topic=payment
 *    Body vacío. Todos los datos en query params.
 *    `topic` puede ser "payment" o "merchant_order".
 *
 * Este controller normaliza ambos: lee `dataId` y `type` priorizando
 * el body y cayendo a query params si no están. Solo procesa
 * notificaciones de pago (topic/type === 'payment'); las de
 * merchant_order se ack-ean sin procesar.
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly processPaymentNotificationUseCase: ProcessPaymentNotificationUseCase,
  ) {}

  @Post('mercadopago')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  async handleMercadoPago(
    @Query() query: Record<string, string | undefined>,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    // NOTA: usamos `Record<string, any>` en vez de un DTO con class-validator
    // para BYPASEAR el ValidationPipe global (que tiene
    // forbidNonWhitelisted: true). MP envía muchos campos no declarables
    // (live_mode, version, user_id, api_version, etc.) que harían fallar
    // cualquier DTO estricto con 400. Con `Object` como metatype, el pipe
    // skipea validación y nos pasa el body crudo.
    @Body() body: Record<string, any> = {},
  ) {
    // Normalizar: body wins, query como fallback. MP usa `type` (nuevo) o
    // `topic` (legacy) para el tipo, y `data.id` (nuevo) o `id` (legacy).
    const bodyType = typeof body?.type === 'string' ? body.type : undefined;
    const bodyDataId =
      body?.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>).id
        : undefined;
    const rawType = bodyType ?? query['type'] ?? query['topic'];
    const rawDataId =
      (typeof bodyDataId === 'string' || typeof bodyDataId === 'number'
        ? String(bodyDataId)
        : undefined) ??
      query['data.id'] ??
      (rawType === 'payment' ? query['id'] : undefined);

    this.logger.log(
      `Webhook MP recibido: type=${rawType ?? '?'} dataId=${rawDataId ?? '?'} requestId=${requestId ?? '?'}`,
    );

    try {
      // merchant_order y otros eventos: ack sin procesar.
      if (rawType !== 'payment' || !rawDataId) {
        this.logger.log(
          `Webhook ignorado: type=${rawType ?? '?'} — no es payment`,
        );
        return BaseResponse.ok(null);
      }

      const dataId = String(rawDataId);

      // Verificación de firma HMAC — obligatoria si hay secret configurado
      const hasSecret =
        this.processPaymentNotificationUseCase.hasWebhookSecret();

      if (hasSecret) {
        const valid = this.processPaymentNotificationUseCase.verifySignature(
          dataId,
          requestId,
          signature,
        );
        if (!valid) {
          this.logger.error(
            `Invalid webhook signature for payment ${dataId} (requestId=${requestId ?? '?'}) — rechazando`,
          );
          // 200 igual para que MP no haga retry infinito; el error está logueado.
          return BaseResponse.ok(null);
        }
        this.logger.log(`Firma webhook válida para payment ${dataId}`);
      } else {
        this.logger.warn(
          'MERCADOPAGO_WEBHOOK_SECRET no configurado — procesando sin verificar firma',
        );
      }

      await this.processPaymentNotificationUseCase.execute(dataId);
      this.logger.log(`Payment ${dataId} procesado OK`);
    } catch (error) {
      this.logger.error(
        `Webhook processing error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    // Always return 200
    return BaseResponse.ok(null);
  }
}
