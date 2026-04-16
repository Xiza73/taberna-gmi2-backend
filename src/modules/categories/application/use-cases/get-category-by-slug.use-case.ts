import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { CATEGORY_REPOSITORY, type ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class GetCategoryBySlugUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
    }
    return new CategoryResponseDto(category);
  }
}
