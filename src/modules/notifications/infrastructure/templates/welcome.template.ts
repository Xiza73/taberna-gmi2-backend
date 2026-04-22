import { escapeHtml } from './escape-html';

export function welcomeTemplate(name: string): {
  subject: string;
  html: string;
} {
  const safeName = escapeHtml(name);
  return {
    subject: '¡Bienvenido a nuestra tienda!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Hola ${safeName}!</h1>
        <p>Gracias por registrarte en nuestra tienda. Estamos encantados de tenerte.</p>
        <p>Ya puedes explorar nuestro catálogo y realizar tus compras.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
