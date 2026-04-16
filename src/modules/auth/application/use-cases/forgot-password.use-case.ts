import { Inject, Injectable, Logger } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { USER_REPOSITORY, type IUserRepository } from '../../../users/domain/interfaces/user-repository.interface.js';
import { type ForgotPasswordDto } from '../dtos/forgot-password.dto.js';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
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

    // TODO: Send email via IEmailSender.sendPasswordReset() (Phase 13: Notifications)
    this.logger.log(`Password reset token generated for user ${user.id}: ${rawToken}`);
  }
}
