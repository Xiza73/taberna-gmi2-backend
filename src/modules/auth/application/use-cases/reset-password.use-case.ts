import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

import { USER_REPOSITORY, type IUserRepository } from '../../../users/domain/interfaces/user-repository.interface.js';
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface.js';
import { type ResetPasswordDto } from '../dtos/reset-password.dto.js';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    // Find user by iterating — in production, add a findByResetToken method
    // For now, the token contains user-identifying info via the reset flow
    const [userId, rawToken] = dto.token.split('.');
    if (!userId || !rawToken) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const user = await this.userRepository.findById(userId);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const valid = await compare(rawToken, user.resetPasswordToken);
    if (!valid) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const hashedPassword = await hash(dto.newPassword, 12);
    user.changePassword(hashedPassword);
    user.clearResetPasswordToken();
    await this.userRepository.save(user);

    await this.refreshTokenRepository.revokeAllByUser(user.id);
  }
}
