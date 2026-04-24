import { IsEnum } from 'class-validator';

import { StaffRole } from '@shared/domain/enums/staff-role.enum';

export class ChangeStaffRoleDto {
  @IsEnum(StaffRole)
  role: StaffRole;
}
