import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStaffProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;
}
