import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import { USER_REPOSITORY, type IUserRepository } from '../../../users/domain/interfaces/user-repository.interface.js';
import { UserResponseDto } from '../../../users/application/dtos/user-response.dto.js';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundException('User', userId);
    return new UserResponseDto(user);
  }
}
