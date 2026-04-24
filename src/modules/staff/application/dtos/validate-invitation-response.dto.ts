export class ValidateInvitationResponseDto {
  email: string;
  role: string;
  invitedByName: string;

  constructor(email: string, role: string, invitedByName: string) {
    this.email = email;
    this.role = role;
    this.invitedByName = invitedByName;
  }
}
