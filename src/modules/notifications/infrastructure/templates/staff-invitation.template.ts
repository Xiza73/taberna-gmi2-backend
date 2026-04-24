import { escapeHtml } from './escape-html';

export function staffInvitationTemplate(props: {
  email: string;
  role: string;
  invitedByName: string;
  invitationUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Invitación al equipo de administración',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Has sido invitado!</h1>
        <p>${escapeHtml(props.invitedByName)} te ha invitado a unirte al equipo como <strong>${escapeHtml(props.role)}</strong>.</p>
        <p>
          <a href="${escapeHtml(props.invitationUrl)}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Aceptar invitación
          </a>
        </p>
        <p style="color: #666;">Esta invitación expira en 72 horas.</p>
        <hr style="border: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
      </div>
    `,
  };
}
