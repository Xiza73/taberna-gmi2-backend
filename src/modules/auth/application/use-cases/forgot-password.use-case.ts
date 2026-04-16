import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/interfaces/user-repository.interface.js';
import { type ForgotPasswordDto } from '../dtos/forgot-password.dto.js';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) return;

    const rawToken = randomUUID();
    const tokenHash = await hash(rawToken, 12);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.setResetPasswordToken(tokenHash, expires);
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${user.id}.${rawToken}`;
    this.emailSender
      .sendPasswordReset({ name: user.name, email: user.email, resetUrl })
      .catch(() => {});
  }
}
