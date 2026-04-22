import { Inject, Injectable } from '@nestjs/common';

import {
  DomainConflictException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { Category } from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface';
import { type CreateCategoryDto } from '../dtos/create-category.dto';
import { CategoryResponseDto } from '../dtos/category-response.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const slugExists = await this.categoryRepository.slugExists(dto.slug);
    if (slugExists) {
      throw new DomainConflictException(ErrorMessages.SLUG_ALREADY_EXISTS);
    }

    if (dto.parentId) {
      const parent = await this.categoryRepository.findById(dto.parentId);
      if (!parent) {
        throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
      }
    }

    const category = Category.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      parentId: dto.parentId,
      sortOrder: dto.sortOrder,
    });

    const saved = await this.categoryRepository.save(category);
    return new CategoryResponseDto(saved);
  }
}
