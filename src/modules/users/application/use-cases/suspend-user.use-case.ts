import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import { USER_REPOSITORY, type IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from '../../../auth/domain/interfaces/refresh-token-repository.interface.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';

@Injectable()
export class SuspendUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundException('User', userId);

    user.suspend();
    const saved = await this.userRepository.save(user);

    await this.refreshTokenRepository.revokeAllByUser(userId);

    return new UserResponseDto(saved);
  }
}
