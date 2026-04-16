export function orderDeliveredTemplate(props: {
  orderNumber: string;
  customerName: string;
  productNames: string[];
}): { subject: string; html: string } {
  const productsList = props.productNames.map((name) => `<li>${name}</li>`).join('');

  return {
    subject: `Tu pedido ${props.orderNumber} ha sido entregado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Pedido entregado, ${props.customerName}!</h1>
        <p>Tu pedido <strong>${props.orderNumber}</strong> ha sido entregado exitosamente.</p>
        <p>Productos recibidos:</p>
        <ul>${productsList}</ul>
        <p>¿Te gustaron tus productos? ¡Déjanos una reseña!</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
