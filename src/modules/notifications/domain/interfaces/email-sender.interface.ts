export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface SendWelcomeProps {
  name: string;
  email: string;
}

export interface SendOrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  email: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
}

export interface SendPaymentConfirmedProps {
  orderNumber: string;
  customerName: string;
  email: string;
  total: number;
}

export interface SendOrderShippedProps {
  orderNumber: string;
  customerName: string;
  email: string;
  carrier: string;
  trackingUrl: string;
}

export interface SendOrderDeliveredProps {
  orderNumber: string;
  customerName: string;
  email: string;
  productNames: string[];
}

export interface SendPasswordResetProps {
  name: string;
  email: string;
  resetUrl: string;
}

export interface SendStaffInvitationProps {
  email: string;
  role: string;
  invitedByName: string;
  invitationUrl: string;
}

export interface IEmailSender {
  sendWelcome(props: SendWelcomeProps): Promise<void>;
  sendOrderConfirmation(props: SendOrderConfirmationProps): Promise<void>;
  sendPaymentConfirmed(props: SendPaymentConfirmedProps): Promise<void>;
  sendOrderShipped(props: SendOrderShippedProps): Promise<void>;
  sendOrderDelivered(props: SendOrderDeliveredProps): Promise<void>;
  sendPasswordReset(props: SendPasswordResetProps): Promise<void>;
  sendStaffInvitation(props: SendStaffInvitationProps): Promise<void>;
}
