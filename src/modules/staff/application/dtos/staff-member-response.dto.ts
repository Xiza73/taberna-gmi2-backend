import { type StaffMember } from '../../domain/entities/staff-member.entity.js';

export class StaffMemberResponseDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;

  constructor(staff: StaffMember) {
    this.id = staff.id;
    this.name = staff.name;
    this.email = staff.email;
    this.isActive = staff.isActive;
    this.createdAt = staff.createdAt.toISOString();
  }
}
