import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DomainException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  type IPaymentProvider,
  type PaymentInfo,
} from '../../domain/interfaces/payment-provider.interface.js';

@Injectable()
export class MercadoPagoPaymentService implements IPaymentProvider {
  private readonly logger = new Logger(MercadoPagoPaymentService.name);
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly configService: ConfigService) {
    this.accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
      '',
    );
  }

  async createPreference(order: {
    id: string;
    orderNumber: string;
    items: Array<{ title: string; quantity: number; unitPrice: number }>;
    total: number;
    payerEmail: string;
  }): Promise<{ preferenceId: string; paymentUrl: string }> {
    try {
      const body = {
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice / 100,
          currency_id: 'PEN',
        })),
        payer: { email: order.payerEmail },
        external_reference: order.id,
        back_urls: {
          success: this.configService.get<string>(
            'MERCADOPAGO_SUCCESS_URL',
            '',
          ),
          failure: this.configService.get<string>(
            'MERCADOPAGO_FAILURE_URL',
            '',
          ),
          pending: this.configService.get<string>(
            'MERCADOPAGO_PENDING_URL',
            '',
          ),
        },
        auto_return: 'approved',
        notification_url: this.configService.get<string>(
          'MERCADOPAGO_WEBHOOK_URL',
          '',
        ),
      };

      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`MercadoPago createPreference failed: ${error}`);
        throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
      }

      const data = (await response.json()) as {
        id: string;
        init_point: string;
      };
      return { preferenceId: data.id, paymentUrl: data.init_point };
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.error('MercadoPago createPreference error', error);
      throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
    }
  }

  async getPaymentInfo(paymentId: string): Promise<PaymentInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`MercadoPago getPaymentInfo failed: ${error}`);
        throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
      }

      const data = (await response.json()) as {
        id: number;
        status: string;
        payment_method_id: string;
        transaction_amount: number;
        date_approved: string | null;
        [key: string]: unknown;
      };

      return {
        externalId: String(data.id),
        status: data.status,
        method: data.payment_method_id ?? null,
        transactionAmount: Math.round(data.transaction_amount * 100),
        paidAt: data.date_approved ? new Date(data.date_approved) : null,
        rawResponse: data as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.error('MercadoPago getPaymentInfo error', error);
      throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
    }
  }

  async getPreferencePayments(preferenceId: string): Promise<PaymentInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/payments/search?external_reference=${preferenceId}&sort=date_created&criteria=desc`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`MercadoPago getPreferencePayments failed: ${error}`);
        throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
      }

      const data = (await response.json()) as {
        results: Array<{
          id: number;
          status: string;
          payment_method_id: string;
          transaction_amount: number;
          date_approved: string | null;
          [key: string]: unknown;
        }>;
      };

      return data.results.map((p) => ({
        externalId: String(p.id),
        status: p.status,
        method: p.payment_method_id ?? null,
        transactionAmount: Math.round(p.transaction_amount * 100),
        paidAt: p.date_approved ? new Date(p.date_approved) : null,
        rawResponse: p as Record<string, unknown>,
      }));
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.error('MercadoPago getPreferencePayments error', error);
      throw new DomainException(ErrorMessages.PAYMENT_VERIFICATION_FAILED);
    }
  }
}
