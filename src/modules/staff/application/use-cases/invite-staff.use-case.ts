import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { DomainConflictException, DomainForbiddenException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';
import { EMAIL_SENDER, type IEmailSender } from '@modules/notifications/domain/interfaces/email-sender.interface';

import { STAFF_MEMBER_REPOSITORY, type IStaffMemberRepository } from '../../domain/interfaces/staff-member-repository.interface';
import { STAFF_INVITATION_REPOSITORY, type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { type InviteStaffDto } from '../dtos/invite-staff.dto';
import { StaffInvitationResponseDto } from '../dtos/staff-invitation-response.dto';

@Injectable()
export class InviteStaffUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
    @Inject(STAFF_INVITATION_REPOSITORY)
    private readonly staffInvitationRepository: IStaffInvitationRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    dto: InviteStaffDto,
    currentUserId: string,
    currentUserRole: StaffRole,
  ): Promise<StaffInvitationResponseDto> {
    // Hierarchy validation
    if (currentUserRole === StaffRole.USER) {
      throw new DomainForbiddenException(ErrorMessages.INVITATION_CANNOT_INVITE_ROLE);
    }

    if (currentUserRole === StaffRole.ADMIN && dto.role !== StaffRole.USER) {
      throw new DomainForbiddenException(ErrorMessages.INVITATION_CANNOT_INVITE_ROLE);
    }

    if (
      currentUserRole === StaffRole.SUPER_ADMIN &&
      dto.role !== StaffRole.ADMIN &&
      dto.role !== StaffRole.USER
    ) {
      throw new DomainForbiddenException(ErrorMessages.INVITATION_CANNOT_INVITE_ROLE);
    }

    // Check if email already belongs to existing staff
    const existingStaff = await this.staffMemberRepository.findByEmail(dto.email);
    if (existingStaff) {
      throw new DomainConflictException(ErrorMessages.INVITATION_EMAIL_EXISTS);
    }

    // Check if pending invitation exists for email and revoke it
    const pendingInvitation = await this.staffInvitationRepository.findPendingByEmail(dto.email);
    if (pendingInvitation) {
      pendingInvitation.revoke();
      await this.staffInvitationRepository.save(pendingInvitation);
    }

    // Generate raw token and hash it
    const rawToken = randomUUID();
    const tokenHash = await hash(rawToken, 12);

    // Create invitation
    const invitation = StaffInvitation.create({
      email: dto.email,
      role: dto.role,
      tokenHash,
      invitedBy: currentUserId,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });

    // Save invitation
    const savedInvitation = await this.staffInvitationRepository.save(invitation);

    // Build composite token and invitation URL
    const compositeToken = `${savedInvitation.id}.${rawToken}`;
    const backofficeUrl = this.configService.get('BACKOFFICE_URL', 'http://localhost:5174');
    const invitationUrl = `${backofficeUrl}/staff/register?token=${compositeToken}`;

    // Get inviter name
    const inviter = await this.staffMemberRepository.findById(currentUserId);

    // Send email
    await this.emailSender.sendStaffInvitation({
      email: dto.email,
      role: dto.role,
      invitedByName: inviter?.name ?? 'Admin',
      invitationUrl,
    });

    return new StaffInvitationResponseDto(savedInvitation);
  }
}
