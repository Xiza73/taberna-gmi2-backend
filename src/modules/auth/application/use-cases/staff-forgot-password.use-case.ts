import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface.js';
import { type ForgotPasswordDto } from '../dtos/forgot-password.dto.js';

@Injectable()
export class StaffForgotPasswordUseCase {
  private readonly logger = new Logger(StaffForgotPasswordUseCase.name);

  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const staff = await this.staffRepository.findByEmail(dto.email);
    if (!staff) return;

    const rawToken = randomUUID();
    const tokenHash = await hash(rawToken, 12);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    staff.setResetPasswordToken(tokenHash, expires);
    await this.staffRepository.save(staff);

    const backofficeUrl = this.configService.get<string>(
      'BACKOFFICE_URL',
      'http://localhost:5174',
    );
    const resetUrl = `${backofficeUrl}/reset-password?token=${staff.id}.${rawToken}`;
    this.emailSender
      .sendPasswordReset({
        name: staff.name,
        email: staff.email,
        resetUrl,
      })
      .catch(() => {});
  }
}
