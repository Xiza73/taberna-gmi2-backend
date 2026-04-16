export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentInfo {
  externalId: string;
  status: string;
  method: string | null;
  transactionAmount: number;
  paidAt: Date | null;
  rawResponse: Record<string, unknown>;
}

export interface IPaymentProvider {
  createPreference(order: {
    id: string;
    orderNumber: string;
    items: Array<{ title: string; quantity: number; unitPrice: number }>;
    total: number;
    payerEmail: string;
  }): Promise<{ preferenceId: string; paymentUrl: string }>;

  getPaymentInfo(paymentId: string): Promise<PaymentInfo>;

  getPreferencePayments(preferenceId: string): Promise<PaymentInfo[]>;
}
