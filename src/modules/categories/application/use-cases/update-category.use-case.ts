import { Inject, Injectable } from '@nestjs/common';

import { DomainConflictException, DomainException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { CATEGORY_REPOSITORY, type ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { type UpdateCategoryDto } from '../dtos/update-category.dto.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
    }

    if (dto.slug !== undefined) {
      const slugExists = await this.categoryRepository.slugExists(dto.slug, id);
      if (slugExists) {
        throw new DomainConflictException(ErrorMessages.SLUG_ALREADY_EXISTS);
      }
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new DomainException('Category cannot be its own parent');
      }
      const parent = await this.categoryRepository.findById(dto.parentId);
      if (!parent) {
        throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
      }
    }

    category.update(dto);
    const saved = await this.categoryRepository.save(category);
    return new CategoryResponseDto(saved);
  }
}
