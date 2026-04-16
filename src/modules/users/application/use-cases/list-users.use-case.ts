import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto.js';

import { USER_REPOSITORY, type IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { type UserQueryDto } from '../dtos/user-query.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: UserQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { items, total } = await this.userRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });

    return new PaginatedResponseDto(
      items.map((user) => new UserResponseDto(user)),
      total,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
