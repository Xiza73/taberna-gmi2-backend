import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto.js';

import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface.js';
import { type CategoryQueryDto } from '../dtos/category-query.dto.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class AdminListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    query: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.categoryRepository.findAll({
      page,
      limit,
      includeInactive: query.includeInactive,
    });

    return new PaginatedResponseDto(
      items.map((c) => new CategoryResponseDto(c)),
      total,
      page,
      limit,
    );
  }
}
