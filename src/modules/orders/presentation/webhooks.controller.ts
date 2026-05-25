import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { ProcessPaymentNotificationUseCase } from '../application/use-cases/process-payment-notification.use-case';
import { MercadoPagoNotificationDto } from '../application/dtos/mercado-pago-notification.dto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly processPaymentNotificationUseCase: ProcessPaymentNotificationUseCase,
  ) {}

  @Post('mercadopago')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )
  async handleMercadoPago(
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Body() dto: MercadoPagoNotificationDto,
  ) {
    this.logger.log(
      `Webhook MP recibido: type=${dto?.type ?? '?'} action=${dto?.action ?? '?'} dataId=${dto?.data?.id ?? '?'} requestId=${requestId ?? '?'}`,
    );
    try {
      // Solo procesamos notificaciones de pago — eventos de prueba
      // (stop_delivery_op_wh, fraud alerts, etc.) se ack sin firma.
      if (dto.type !== 'payment' || !dto.data?.id) {
        this.logger.log(
          `Webhook ignorado: type=${dto?.type ?? '?'} — no es un pago`,
        );
        return BaseResponse.ok(null);
      }

      const dataId = String(dto.data.id);

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
