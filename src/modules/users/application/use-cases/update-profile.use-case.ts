import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import { USER_REPOSITORY, type IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { type UpdateProfileDto } from '../dtos/update-profile.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundException('User', userId);

    user.updateProfile({ name: dto.name, phone: dto.phone });
    const saved = await this.userRepository.save(user);
    return new UserResponseDto(saved);
  }
}
