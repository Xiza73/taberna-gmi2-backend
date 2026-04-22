import { escapeHtml } from './escape-html';

export function orderShippedTemplate(props: {
  orderNumber: string;
  customerName: string;
  carrier: string;
  trackingUrl: string;
}): { subject: string; html: string } {
  const safeTrackingUrl = escapeHtml(props.trackingUrl);
  const trackingLink = props.trackingUrl
    ? `<p><a href="${safeTrackingUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">Rastrear envío</a></p>`
    : '';

  return {
    subject: `Tu pedido ${props.orderNumber} ha sido enviado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Tu pedido está en camino, ${escapeHtml(props.customerName)}!</h1>
        <p>Tu pedido <strong>${props.orderNumber}</strong> ha sido despachado con <strong>${escapeHtml(props.carrier)}</strong>.</p>
        ${trackingLink}
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
