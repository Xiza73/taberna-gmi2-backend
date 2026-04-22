import { escapeHtml } from './escape-html';

export function passwordResetTemplate(props: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Restablecer contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Hola ${escapeHtml(props.name)},</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          <a href="${escapeHtml(props.resetUrl)}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo. El enlace expira en 1 hora.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático, por favor no respondas.</p>
      </div>
    `,
  };
}
