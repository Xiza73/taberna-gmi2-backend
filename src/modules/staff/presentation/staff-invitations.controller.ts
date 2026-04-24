import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';
import { Public } from '@shared/presentation/decorators/public.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { InviteStaffUseCase } from '../application/use-cases/invite-staff.use-case';
import { ListInvitationsUseCase } from '../application/use-cases/list-invitations.use-case';
import { RevokeInvitationUseCase } from '../application/use-cases/revoke-invitation.use-case';
import { ValidateInvitationUseCase } from '../application/use-cases/validate-invitation.use-case';
import { AcceptInvitationUseCase } from '../application/use-cases/accept-invitation.use-case';
import { InviteStaffDto } from '../application/dtos/invite-staff.dto';
import { AcceptInvitationDto } from '../application/dtos/accept-invitation.dto';
import { StaffInvitationQueryDto } from '../application/dtos/staff-invitation-query.dto';

@Controller('admin/staff/invitations')
@RequireSubjectType(SubjectType.STAFF)
@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
export class AdminInvitationsController {
  constructor(
    private readonly inviteStaffUseCase: InviteStaffUseCase,
    private readonly listInvitationsUseCase: ListInvitationsUseCase,
    private readonly revokeInvitationUseCase: RevokeInvitationUseCase,
  ) {}

  @Post()
  async invite(
    @Body() dto: InviteStaffDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    const result = await this.inviteStaffUseCase.execute(
      dto,
      currentUserId,
      currentUserRole as StaffRole,
    );
    return BaseResponse.ok(result);
  }

  @Get()
  async list(@Query() query: StaffInvitationQueryDto) {
    const result = await this.listInvitationsUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async revoke(@Param('id', ParseUUIDPipe) id: string) {
    await this.revokeInvitationUseCase.execute(id);
    return BaseResponse.ok();
  }
}

@Controller('staff/invitations')
export class PublicInvitationsController {
  constructor(
    private readonly validateInvitationUseCase: ValidateInvitationUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
  ) {}

  @Get(':token/validate')
  @Public()
  async validate(@Param('token') token: string) {
    const result = await this.validateInvitationUseCase.execute(token);
    return BaseResponse.ok(result);
  }

  @Post(':token/accept')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    const result = await this.acceptInvitationUseCase.execute(token, dto);
    return BaseResponse.ok(result);
  }
}
