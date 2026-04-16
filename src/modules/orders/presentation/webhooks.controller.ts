import { Body, Controller, Headers, Logger, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type Request } from 'express';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Public } from '@shared/presentation/decorators/public.decorator.js';

import { ProcessPaymentNotificationUseCase } from '../application/use-cases/process-payment-notification.use-case.js';
import { MercadoPagoNotificationDto } from '../application/dtos/mercado-pago-notification.dto.js';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly processPaymentNotificationUseCase: ProcessPaymentNotificationUseCase,
  ) {}

  @Post('mercadopago')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))
  async handleMercadoPago(
    @Req() req: Request,
    @Headers('x-signature') signature: string,
    @Body() dto: MercadoPagoNotificationDto,
  ) {
    try {
      // Verify HMAC signature — mandatory when secret is configured
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      const hasSecret = this.processPaymentNotificationUseCase.hasWebhookSecret();

      if (hasSecret) {
        if (!rawBody || !signature) {
          this.logger.warn('Missing rawBody or signature on webhook with configured secret');
          return BaseResponse.ok(null);
        }
        const valid = this.processPaymentNotificationUseCase.verifySignature(rawBody, signature);
        if (!valid) {
          this.logger.warn('Invalid webhook signature');
          return BaseResponse.ok(null);
        }
      }

      // Only process payment notifications
      if (dto.type !== 'payment' || !dto.data?.id) {
        return BaseResponse.ok(null);
      }

      await this.processPaymentNotificationUseCase.execute(dto.data.id);
    } catch (error) {
      this.logger.error('Webhook processing error', error);
    }

    // Always return 200
    return BaseResponse.ok(null);
  }
}
