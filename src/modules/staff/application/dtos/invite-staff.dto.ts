import { IsEmail, IsEnum } from 'class-validator';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}
