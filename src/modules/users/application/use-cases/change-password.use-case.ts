import { Inject, Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import { USER_REPOSITORY, type IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from '../../../auth/domain/interfaces/refresh-token-repository.interface.js';
import { type ChangePasswordDto } from '../dtos/change-password.dto.js';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundException('User', userId);

    const valid = await compare(dto.currentPassword, user.password);
    if (!valid) throw new DomainException(ErrorMessages.WRONG_PASSWORD);

    const hashedPassword = await hash(dto.newPassword, 12);
    user.changePassword(hashedPassword);
    await this.userRepository.save(user);

    await this.refreshTokenRepository.revokeAllByUser(userId);
  }
}
