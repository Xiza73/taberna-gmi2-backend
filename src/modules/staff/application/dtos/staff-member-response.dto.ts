import { type StaffMember } from '../../domain/entities/staff-member.entity';

export class StaffMemberResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  invitedBy: string | null;
  createdAt: string;

  constructor(staff: StaffMember) {
    this.id = staff.id;
    this.name = staff.name;
    this.email = staff.email;
    this.role = staff.role;
    this.isActive = staff.isActive;
    this.invitedBy = staff.invitedBy;
    this.createdAt = staff.createdAt.toISOString();
  }
}
