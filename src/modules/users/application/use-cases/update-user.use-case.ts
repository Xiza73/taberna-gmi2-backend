import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/interfaces/user-repository.interface.js';
import { type UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundException('User', userId);

    user.updateProfile({ name: dto.name, phone: dto.phone });
    if (dto.role !== undefined) user.updateRole(dto.role);

    const saved = await this.userRepository.save(user);
    return new UserResponseDto(saved);
  }
}
