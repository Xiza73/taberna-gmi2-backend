import { escapeHtml } from './escape-html.js';

export function paymentConfirmedTemplate(props: {
  orderNumber: string;
  customerName: string;
  total: number;
}): { subject: string; html: string } {
  return {
    subject: `Pago confirmado — Pedido ${props.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Pago recibido, ${escapeHtml(props.customerName)}!</h1>
        <p>Tu pago de <strong>S/ ${(props.total / 100).toFixed(2)}</strong> para el pedido <strong>${props.orderNumber}</strong> ha sido confirmado.</p>
        <p>Estamos preparando tu pedido para envío. Te notificaremos cuando sea despachado.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
