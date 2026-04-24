import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StaffMemberOrmEntity } from './infrastructure/orm-entities/staff-member.orm-entity';
import { StaffInvitationOrmEntity } from './infrastructure/orm-entities/staff-invitation.orm-entity';
import { StaffMemberRepository } from './infrastructure/repositories/staff-member.repository';
import { StaffInvitationRepository } from './infrastructure/repositories/staff-invitation.repository';
import { STAFF_MEMBER_REPOSITORY } from './domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY } from './domain/interfaces/staff-invitation-repository.interface';
import { CreateStaffMemberUseCase } from './application/use-cases/create-staff-member.use-case';
import { ListStaffMembersUseCase } from './application/use-cases/list-staff-members.use-case';
import { GetStaffMemberUseCase } from './application/use-cases/get-staff-member.use-case';
import { UpdateStaffMemberUseCase } from './application/use-cases/update-staff-member.use-case';
import { SuspendStaffMemberUseCase } from './application/use-cases/suspend-staff-member.use-case';
import { ActivateStaffMemberUseCase } from './application/use-cases/activate-staff-member.use-case';
import { ChangeStaffRoleUseCase } from './application/use-cases/change-staff-role.use-case';
import { InviteStaffUseCase } from './application/use-cases/invite-staff.use-case';
import { ValidateInvitationUseCase } from './application/use-cases/validate-invitation.use-case';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { ListInvitationsUseCase } from './application/use-cases/list-invitations.use-case';
import { RevokeInvitationUseCase } from './application/use-cases/revoke-invitation.use-case';
import { AdminStaffController } from './presentation/admin-staff.controller';
import {
  AdminInvitationsController,
  PublicInvitationsController,
} from './presentation/staff-invitations.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffMemberOrmEntity, StaffInvitationOrmEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    // AdminInvitationsController must come BEFORE AdminStaffController:
    // both share the /admin/staff prefix and NestJS matches routes in
    // registration order. AdminStaffController has @Get(':id') which would
    // otherwise catch /admin/staff/invitations as id="invitations" and fail
    // ParseUUIDPipe with 400.
    AdminInvitationsController,
    PublicInvitationsController,
    AdminStaffController,
  ],
  providers: [
    { provide: STAFF_MEMBER_REPOSITORY, useClass: StaffMemberRepository },
    {
      provide: STAFF_INVITATION_REPOSITORY,
      useClass: StaffInvitationRepository,
    },
    CreateStaffMemberUseCase,
    ListStaffMembersUseCase,
    GetStaffMemberUseCase,
    UpdateStaffMemberUseCase,
    SuspendStaffMemberUseCase,
    ActivateStaffMemberUseCase,
    ChangeStaffRoleUseCase,
    InviteStaffUseCase,
    ValidateInvitationUseCase,
    AcceptInvitationUseCase,
    ListInvitationsUseCase,
    RevokeInvitationUseCase,
  ],
  exports: [STAFF_MEMBER_REPOSITORY],
})
export class StaffModule {}
