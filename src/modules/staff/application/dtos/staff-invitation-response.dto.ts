import { type StaffInvitation } from '../../domain/entities/staff-invitation.entity';

export class StaffInvitationResponseDto {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;

  constructor(invitation: StaffInvitation) {
    this.id = invitation.id;
    this.email = invitation.email;
    this.role = invitation.role;
    this.invitedBy = invitation.invitedBy;
    this.expiresAt = invitation.expiresAt.toISOString();
    this.createdAt = invitation.createdAt.toISOString();
  }
}
