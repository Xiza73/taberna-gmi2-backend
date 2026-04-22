import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StaffMemberOrmEntity } from './infrastructure/orm-entities/staff-member.orm-entity';
import { StaffMemberRepository } from './infrastructure/repositories/staff-member.repository';
import { STAFF_MEMBER_REPOSITORY } from './domain/interfaces/staff-member-repository.interface';
import { CreateStaffMemberUseCase } from './application/use-cases/create-staff-member.use-case';
import { ListStaffMembersUseCase } from './application/use-cases/list-staff-members.use-case';
import { GetStaffMemberUseCase } from './application/use-cases/get-staff-member.use-case';
import { UpdateStaffMemberUseCase } from './application/use-cases/update-staff-member.use-case';
import { SuspendStaffMemberUseCase } from './application/use-cases/suspend-staff-member.use-case';
import { ActivateStaffMemberUseCase } from './application/use-cases/activate-staff-member.use-case';
import { AdminStaffController } from './presentation/admin-staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StaffMemberOrmEntity])],
  controllers: [AdminStaffController],
  providers: [
    { provide: STAFF_MEMBER_REPOSITORY, useClass: StaffMemberRepository },
    CreateStaffMemberUseCase,
    ListStaffMembersUseCase,
    GetStaffMemberUseCase,
    UpdateStaffMemberUseCase,
    SuspendStaffMemberUseCase,
    ActivateStaffMemberUseCase,
  ],
  exports: [STAFF_MEMBER_REPOSITORY],
})
export class StaffModule {}
