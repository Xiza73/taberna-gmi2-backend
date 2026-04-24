import { IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from '@shared/application/dtos/pagination.dto';

import { InvitationStatus } from '../../domain/enums/invitation-status.enum';

export class StaffInvitationQueryDto extends PaginationDto {
  @IsEnum(InvitationStatus)
  @IsOptional()
  status?: InvitationStatus;
}
