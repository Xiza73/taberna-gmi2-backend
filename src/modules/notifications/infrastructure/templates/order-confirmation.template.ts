import { escapeHtml } from './escape-html.js';

export function orderConfirmationTemplate(props: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
}): { subject: string; html: string } {
  const safeName = escapeHtml(props.customerName);
  const itemsHtml = props.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${(item.unitPrice / 100).toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  return {
    subject: `Pedido ${props.orderNumber} confirmado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Gracias por tu pedido, ${safeName}!</h1>
        <p>Tu pedido <strong>${props.orderNumber}</strong> ha sido registrado exitosamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Producto</th>
              <th style="padding: 8px; text-align: center;">Cant.</th>
              <th style="padding: 8px; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size: 18px; font-weight: bold;">Total: S/ ${(props.total / 100).toFixed(2)}</p>
        <p>Recibirás otro correo cuando tu pago sea confirmado.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
