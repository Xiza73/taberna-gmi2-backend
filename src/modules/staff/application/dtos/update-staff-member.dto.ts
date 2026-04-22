import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStaffMemberDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
