import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { UserRole } from '@shared/domain/enums/user-role.enum.js';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
