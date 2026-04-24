import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

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
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
    });
    this.from = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@tienda.com',
    );
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
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
