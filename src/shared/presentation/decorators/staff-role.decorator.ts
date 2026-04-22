import { SetMetadata } from '@nestjs/common';

import { type StaffRole } from '../../domain/enums/staff-role.enum.js';

export const STAFF_ROLE_KEY = 'staffRole';
export const RequireStaffRole = (...roles: StaffRole[]) =>
  SetMetadata(STAFF_ROLE_KEY, roles);
