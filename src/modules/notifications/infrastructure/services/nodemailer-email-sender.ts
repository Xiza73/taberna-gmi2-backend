import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { resolve4 } from 'dns/promises';

import {
  type IEmailSender,
  type SendWelcomeProps,
  type SendOrderConfirmationProps,
  type SendPaymentConfirmedProps,
  type SendOrderShippedProps,
  type SendOrderDeliveredProps,
  type SendPasswordResetProps,
  type SendStaffInvitationProps,
} from '../../domain/interfaces/email-sender.interface';
import { welcomeTemplate } from '../templates/welcome.template';
import { orderConfirmationTemplate } from '../templates/order-confirmation.template';
import { paymentConfirmedTemplate } from '../templates/payment-confirmed.template';
import { orderShippedTemplate } from '../templates/order-shipped.template';
import { orderDeliveredTemplate } from '../templates/order-delivered.template';
import { passwordResetTemplate } from '../templates/password-reset.template';
import { staffInvitationTemplate } from '../templates/staff-invitation.template';

@Injectable()
export class NodemailerEmailSender implements IEmailSender {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private transporter: Transporter | null = null;
  private transporterInitPromise: Promise<Transporter> | null = null;
  private readonly from: string;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    this.port = this.configService.get<number>('SMTP_PORT', 587);
    this.user = this.configService.get<string>('SMTP_USER', '');
    this.pass = this.configService.get<string>('SMTP_PASS', '');
    this.from = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@tienda.com',
    );
  }

  /**
   * Resuelve smtp.gmail.com a IPv4 explícitamente y construye el transporter
   * apuntando a esa IP. Railway no soporta IPv6 outbound — sin esto, el
   * resolver elige IPv6 (2607:f8b0:...) y la conexión falla con ENETUNREACH.
   * Usamos `tls.servername` para que la validación del certificado siga
   * funcionando contra el hostname original.
   *
   * Se hace una sola vez (cache en `this.transporter`). Si la primera
   * resolución falla, queda libre para reintentar en la próxima request.
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;
    if (this.transporterInitPromise) return this.transporterInitPromise;

    this.transporterInitPromise = (async () => {
      const ipv4Addresses = await resolve4(this.host);
      if (ipv4Addresses.length === 0) {
        throw new Error(`No IPv4 address found for ${this.host}`);
      }
      const ipv4 = ipv4Addresses[0];
      this.logger.log(
        `SMTP resolved ${this.host} → ${ipv4} (forced IPv4 for Railway compat)`,
      );

      const transporter = createTransport({
        host: ipv4,
        port: this.port,
        secure: this.port === 465,
        auth: { user: this.user, pass: this.pass },
        // Validar TLS cert contra el hostname original (no contra la IP).
        tls: { servername: this.host },
      });
      this.transporter = transporter;
      return transporter;
    })();

    try {
      return await this.transporterInitPromise;
    } finally {
      this.transporterInitPromise = null;
    }
  }

  async sendWelcome(props: SendWelcomeProps): Promise<void> {
    const { subject, html } = welcomeTemplate(props.name);
    await this.send(props.email, subject, html);
  }

  async sendOrderConfirmation(
    props: SendOrderConfirmationProps,
  ): Promise<void> {
    const { subject, html } = orderConfirmationTemplate({
      orderNumber: props.orderNumber,
      customerName: props.customerName,
      items: props.items,
      total: props.total,
    });
    await this.send(props.email, subject, html);
  }

  async sendPaymentConfirmed(props: SendPaymentConfirmedProps): Promise<void> {
    const { subject, html } = paymentConfirmedTemplate({
      orderNumber: props.orderNumber,
      customerName: props.customerName,
      total: props.total,
    });
    await this.send(props.email, subject, html);
  }

  async sendOrderShipped(props: SendOrderShippedProps): Promise<void> {
    const { subject, html } = orderShippedTemplate({
      orderNumber: props.orderNumber,
      customerName: props.customerName,
      carrier: props.carrier,
      trackingUrl: props.trackingUrl,
    });
    await this.send(props.email, subject, html);
  }

  async sendOrderDelivered(props: SendOrderDeliveredProps): Promise<void> {
    const { subject, html } = orderDeliveredTemplate({
      orderNumber: props.orderNumber,
      customerName: props.customerName,
      productNames: props.productNames,
    });
    await this.send(props.email, subject, html);
  }

  async sendPasswordReset(props: SendPasswordResetProps): Promise<void> {
    const { subject, html } = passwordResetTemplate({
      name: props.name,
      resetUrl: props.resetUrl,
    });
    await this.send(props.email, subject, html);
  }

  async sendStaffInvitation(props: SendStaffInvitationProps): Promise<void> {
    const { subject, html } = staffInvitationTemplate({
      email: props.email,
      role: props.role,
      invitedByName: props.invitedByName,
      invitationUrl: props.invitationUrl,
    });
    await this.send(props.email, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      await transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Si el transporter falló al crearse, lo invalida para reintentar
      // en la próxima request (puede ser DNS transitorio).
      this.transporter = null;
    }
  }
}
